import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "./LiveTelemetry.css";
import idMap from "../idMap";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
);
// Configuration
// Same-host websocket URL (works on EC2, EB, and behind Cloudflare)
const WS_URL = (import.meta.env.VITE_WS_URL?.trim()) // Manual override via enc var
  ? import.meta.env.VITE_WS_URL.trim()
  : (() => { // Auto-detect ws/wss based on page protocol
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/api/ws/livetelemetry`;
})();

const RECONNECT_INTERVAL = 3000;
const TICK_TIME_MS = 50; // ms, how often data changes
const ANIMATION_TIME = TICK_TIME_MS; // ms, Chart.js animation duration
const DATA_SAVED_DURATION_S = 60; // seconds of data to keep in charts
const MAX_DATA_POINTS = DATA_SAVED_DURATION_S * (1000 / TICK_TIME_MS); // max points to keep based on tick interval
const MAX_LOG_ENTRIES = 30; // Max # of entries to keep in telemetry feed
const LOG_FLUSH_TIME_MS = 250; // How often telemetry feed log is flushed (ms)
const PERF_LOG_INTERVAL_MS = 5000;
const PERF_DEBUG = (() => {
  const raw = import.meta.env.VITE_LIVE_TELEMETRY_DEBUG_PERF;
  if (raw == null) return false;
  const normalized = String(raw).trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(normalized);
})();

let autoReconnect = true; // when disconnect button is pushed, disables auto-reconnect

// ---------- Safe parsing helpers ----------
const parseBigInt = (x) => {
  if (typeof x === "bigint") return x;
  if (typeof x === "number") return BigInt(Math.trunc(x));
  if (typeof x === "string") {
    try {
      return BigInt(x);
    } catch {
      return 0n;
    }
  }
  return 0n;
};

const asBigIntArray = (data) => {
  if (Array.isArray(data)) return data.map(parseBigInt);
  return [parseBigInt(data)];
};

const bigintToSafeNumber = (b) => {
  const MAX = BigInt(Number.MAX_SAFE_INTEGER);
  const MIN = BigInt(Number.MIN_SAFE_INTEGER);
  if (b > MAX) return Number.MAX_SAFE_INTEGER;
  if (b < MIN) return Number.MIN_SAFE_INTEGER;
  return Number(b);
};

function LiveTelemetry() {
  // Connection state
  const [connected, setConnected] = useState(false);
  // Latest telemetry per ID
  const [telemetryData, setTelemetryData] = useState({});
  const [logEntries, setLogEntries] = useState([]);
  const [loggingEnabled, setLoggingEnabled] = useState(true);

  // WebSocket refs
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const logQueueRef = useRef([]);
  const loggingEnabledRef = useRef(true);

  // Latest telemetry panel values (buffered)
  const latestRef = useRef({});
  const latestDirtyRef = useRef(false);

  // Latest sample values used by frame-tick charting
  const latestSamplesRef = useRef({
    rpm: null,
    throttle1: null,
    throttle2: null,
    brake: null,
    battery: null,
  });
  const sampleSeqRef = useRef(0);
  const lastDrawnSeqRef = useRef(0);

  // Canonical chart series (mutated in place)
  const labelsRef = useRef([]);
  const rpmSeriesRef = useRef([]);
  const throttle1SeriesRef = useRef([]);
  const throttle2SeriesRef = useRef([]);
  const brakeSeriesRef = useRef([]);
  const batterySeriesRef = useRef([]);

  // Chart.js instance refs for imperative incremental updates
  const rpmChartRef = useRef(null);
  const throttleBrakeChartRef = useRef(null);
  const batteryChartRef = useRef(null);
  const perfCountersRef = useRef({
    messagesProcessed: 0,
    chartTicks: 0,
    chartUpdates: 0,
    telemetryStateCommits: 0,
    ticksWithNewSamples: 0,
  });
  const perfSnapshotRef = useRef({
    messagesProcessed: 0,
    chartTicks: 0,
    chartUpdates: 0,
    telemetryStateCommits: 0,
    ticksWithNewSamples: 0,
  });

  // Queue telemetry feed entries and flush on interval
  const enqueueLogEntry = (sensor, data) => {
    if (!loggingEnabledRef.current) return;
    const timestamp = new Date().toLocaleTimeString();
    logQueueRef.current.push({ timestamp, sensor, data });
  };

  const toggleLogging = () => {
    setLoggingEnabled((prev) => {
      const next = !prev;
      if (!next) {
        logQueueRef.current = [];
      }
      loggingEnabledRef.current = next;
      return next;
    });
  };

  const appendSeriesPoint = (seriesRef, value) => {
    const lastValue = seriesRef.current.length
      ? seriesRef.current[seriesRef.current.length - 1]
      : 0;
    seriesRef.current.push(value ?? lastValue);
    if (seriesRef.current.length > MAX_DATA_POINTS) {
      seriesRef.current.shift();
    }
  };

  const appendLabel = () => {
    labelsRef.current.push(new Date().toLocaleTimeString());
    if (labelsRef.current.length > MAX_DATA_POINTS) {
      labelsRef.current.shift();
    }
  };

  const syncChartWindow = (chartRef) => {
    const chart = chartRef.current;
    if (!chart) return false;
    chart.update();
    return true;
  };

  // Update latest-value store (for stat panels)
  const updateLatest = (id, name, displayValue, ts) => {
    const prev = latestRef.current[id];
    latestRef.current[id] = {
      name,
      value: displayValue,
      timestamp: ts,
    };
    if (!prev || prev.value !== displayValue) {
      latestDirtyRef.current = true;
    }
  };

  // ---------- ID-specific handlers ----------
  // Each handler receives: { id, name, data, ts }
  const handlers = {
    0: ({ id, name, data, ts }) => {
      // StartSwitch: 0/1
      const [v] = asBigIntArray(data);
      const n = bigintToSafeNumber(v);
      updateLatest(id, name, n, ts);
      enqueueLogEntry(name, `${n}`);
    },

    1: ({ id, name, data, ts }) => {
      // Throttle1Position (raw or %)
      const [v] = asBigIntArray(data);
      const n = bigintToSafeNumber(v);
      updateLatest(id, name, n, ts);
      latestSamplesRef.current.throttle1 = n;
      sampleSeqRef.current += 1;
      enqueueLogEntry(name, `${v.toString()}`);
    },

    2: ({ id, name, data, ts }) => {
      // Throttle2Position
      const [v] = asBigIntArray(data);
      const n = bigintToSafeNumber(v);
      updateLatest(id, name, n, ts);
      latestSamplesRef.current.throttle2 = n;
      sampleSeqRef.current += 1;
      enqueueLogEntry(name, `${v.toString()}`);
    },

    3: ({ id, name, data, ts }) => {
      // BrakePressure
      const [v] = asBigIntArray(data);
      const n = bigintToSafeNumber(v);
      updateLatest(id, name, n, ts);
      latestSamplesRef.current.brake = n;
      sampleSeqRef.current += 1;
      enqueueLogEntry(name, `${v.toString()}`);
    },

    4: ({ id, name, data, ts }) => {
      // RVC (Acceleration and Rotation)
      const vals = asBigIntArray(data);
      const subId = bigintToSafeNumber(vals[0] ?? 0n);
      const value = bigintToSafeNumber(vals[1] ?? 0n);

      const subIDMap = {
        0: "X-Accel",
        1: "Y-Accel",
        2: "Z-Accel",
        3: "X-Roll",
        4: "Y-Pitch",
        5: "Z-Yaw",
      };

      const subLabel = subIDMap[subId] ?? `Sub${subId}`;
      const display = `${subLabel}: ${value}`;

      updateLatest(id, name, display, ts);
      enqueueLogEntry(name, `${display}`);
    },

    5: ({ id, name, data, ts }) => {
      // TireRPM
      const vals = asBigIntArray(data);
      const rpm = bigintToSafeNumber(vals[1] ?? 0n);
      updateLatest(id, name, rpm, ts);
      latestSamplesRef.current.rpm = rpm;
      sampleSeqRef.current += 1;
      enqueueLogEntry(name, JSON.stringify(vals.map((v) => bigintToSafeNumber(v))));
    },

    6: ({ id, name, data, ts }) => {
      // TireTemperature
      const vals = asBigIntArray(data);
      const wheel = bigintToSafeNumber(vals[0] ?? 0n);
      const tempIn = bigintToSafeNumber(vals[1] ?? 0n);
      const tempOut = bigintToSafeNumber(vals[2] ?? 0n);
      const tempCore = bigintToSafeNumber(vals[3] ?? 0n);
      const labels = ["FL", "FR", "RL", "RR"];
      const display = `${labels[wheel] ?? "?"}=${tempIn}\u00B0C/${tempCore}\u00B0C/${tempOut}\u00B0C`;
      updateLatest(id, name, display, ts);
      enqueueLogEntry(name, display);
    },

    7: ({ id, name, data, ts }) => {
      // BMSPercentage (0-100)
      const [v] = asBigIntArray(data);
      const pct = bigintToSafeNumber(v);
      updateLatest(id, name, pct, ts);
      latestSamplesRef.current.battery = pct;
      sampleSeqRef.current += 1;
      enqueueLogEntry(name, `${v.toString()}`);
    },

    8: ({ id, name, data, ts }) => {
      // BMSTemperature
      const [v] = asBigIntArray(data);
      const temp = bigintToSafeNumber(v);
      updateLatest(id, name, temp, ts);
      enqueueLogEntry(name, `${v.toString()}`);
    },

    9: ({ id, name, data, ts }) => {
      const vals = asBigIntArray(data);
      const lat = Number(vals[0] ?? 0n) / 1e7;
      const lon = Number(vals[1] ?? 0n) / 1e7;
      const display = `lat=${lat.toFixed(6)} lon=${lon.toFixed(6)}`;
      updateLatest(id, name, display, ts);
      enqueueLogEntry(name, display);
    },

    10: ({ id, name, data, ts }) => {
      // Lap
      const [v] = asBigIntArray(data);
      const lap = bigintToSafeNumber(v);
      updateLatest(id, name, lap, ts);
      enqueueLogEntry(name, `${v.toString()}`);
    },
  };

  // ---------- Router ----------
  const handleTelemetryMessage = (msg) => {
    const id = Number(msg.id);
    if (!Number.isFinite(id)) return;
    perfCountersRef.current.messagesProcessed += 1;
    sampleSeqRef.current += 1;

    const ts = msg.timestamp || new Date().toISOString();
    const name = idMap?.[id] || `Sensor ${id}`;
    const fn = handlers[id];

    if (fn) {
      fn({ id, name, data: msg.data, ts });
    } else {
      // Default: single scalar
      const [v] = asBigIntArray(msg.data);
      const n = bigintToSafeNumber(v);
      updateLatest(id, name, n, ts);
      enqueueLogEntry(name, `${v.toString()}`);
    }
    
  };

  // ---------- WebSocket connect/disconnect ----------
  const connectWebSocket = () => {
    try {
      console.log("Connecting to WebSocket:", WS_URL);
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log("WebSocket Connected!");
        setConnected(true);
        enqueueLogEntry("SYSTEM", "Connected to telemetry stream");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "connection") {
            console.log("Connection confirmed:", data.message);
          } else if (data.type === "telemetry") {
            // Expected: {type:"telemetry", id:<int>, data:<string|array>, timestamp?:iso}
            handleTelemetryMessage(data);
          }

        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setConnected(false);
        enqueueLogEntry("SYSTEM", "Disconnected from telemetry stream");
        if(autoReconnect){
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("Attempting to reconnect...");
            connectWebSocket();
          }, RECONNECT_INTERVAL);
        }
      };

      wsRef.current = ws;
      autoReconnect = true; // with manual connect, enable auto-reconnect for accidental disconnects
    } catch (err) {
      console.error("Error creating WebSocket:", err);
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setConnected(false);
    autoReconnect = false; // when intentionally disconnected via button, disable auto-reconnect
  };

  // Auto-connect on mount
  useEffect(() => {
    connectWebSocket();
    return () => disconnectWebSocket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loggingEnabledRef.current = loggingEnabled;
  }, [loggingEnabled]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (logQueueRef.current.length === 0) return;

      const queuedEntries = logQueueRef.current;
      logQueueRef.current = [];
      const newestFirstBatch = queuedEntries
        .slice(-MAX_LOG_ENTRIES)
        .reverse();

      setLogEntries((prev) =>
        [...newestFirstBatch, ...prev].slice(0, MAX_LOG_ENTRIES)
      );
    }, LOG_FLUSH_TIME_MS);

    return () => {
      clearInterval(interval);
      logQueueRef.current = [];
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (latestDirtyRef.current) {
        setTelemetryData({ ...latestRef.current });
        perfCountersRef.current.telemetryStateCommits += 1;
        latestDirtyRef.current = false;
      }
    }, TICK_TIME_MS);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!connected) return undefined;

    const interval = setInterval(() => {
      const counters = perfCountersRef.current;
      counters.chartTicks += 1;
      const hasNewSample = sampleSeqRef.current !== lastDrawnSeqRef.current;
      if (!hasNewSample) return;
      counters.ticksWithNewSamples += 1;
      lastDrawnSeqRef.current = sampleSeqRef.current;

      appendLabel();

      const latest = latestSamplesRef.current;
      appendSeriesPoint(rpmSeriesRef, latest.rpm);
      appendSeriesPoint(throttle1SeriesRef, latest.throttle1);
      appendSeriesPoint(throttle2SeriesRef, latest.throttle2);
      appendSeriesPoint(brakeSeriesRef, latest.brake);
      appendSeriesPoint(batterySeriesRef, latest.battery);

      let updates = 0;
      if (syncChartWindow(rpmChartRef)) updates += 1;
      if (syncChartWindow(throttleBrakeChartRef)) updates += 1;
      if (syncChartWindow(batteryChartRef)) updates += 1;
      counters.chartUpdates += updates;
    }, TICK_TIME_MS);

    return () => clearInterval(interval);
  }, [connected]);

  useEffect(() => {
    if (!PERF_DEBUG) return undefined;

    const interval = setInterval(() => {
      const totals = perfCountersRef.current;
      const snapshot = perfSnapshotRef.current;
      const delta = {
        messagesProcessed: totals.messagesProcessed - snapshot.messagesProcessed,
        chartTicks: totals.chartTicks - snapshot.chartTicks,
        chartUpdates: totals.chartUpdates - snapshot.chartUpdates,
        telemetryStateCommits:
          totals.telemetryStateCommits - snapshot.telemetryStateCommits,
        ticksWithNewSamples: totals.ticksWithNewSamples - snapshot.ticksWithNewSamples,
      };

      console.debug("[LiveTelemetry perf/5s]", delta);
      perfSnapshotRef.current = { ...totals };
    }, PERF_LOG_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  // UI helper: get latest value for id
  const getSensorValue = (msgId) => telemetryData[msgId]?.value ?? 0;

  // ---------- Chart options ----------
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: ANIMATION_TIME, // ms
      easing: "linear",
    },
    plugins: {
      legend: { display: false },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      x: {
        display: true,
        grid: { color: "rgba(255, 255, 255, 0.05)" },
        ticks: { color: "#64748b", maxTicksLimit: 6 },
      },
      y: {
        display: true,
        grid: { color: "rgba(255, 255, 255, 0.05)" },
        ticks: { color: "#64748b" },
      },
    },
    interaction: { mode: "nearest", axis: "x", intersect: false },
  }), []);

  // Tire RPM chart
  const rpmChartData = useMemo(() => ({
    labels: labelsRef.current,
    datasets: [
      {
        label: "Tire RPM",
        data: rpmSeriesRef.current,
        fill: true,
        backgroundColor: "rgba(0, 217, 255, 0.1)",
        borderColor: "#00d9ff",
        borderWidth: 2,
        tension: 0,
        pointRadius: 0,
      },
    ],
  }), []);

  // Throttle & Brake chart
  const throttleBrakeChartData = useMemo(() => ({
    labels: labelsRef.current,
    datasets: [
      {
        label: "Throttle 1",
        data: throttle1SeriesRef.current,
        fill: true,
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        borderColor: "#10b981",
        borderWidth: 2,
        tension: 0,
        pointRadius: 0,
      },
      {
        label: "Throttle 2",
        data: throttle2SeriesRef.current,
        fill: true,
        backgroundColor: "rgba(59, 130, 246, 0.08)",
        borderColor: "#3b82f6",
        borderWidth: 2,
        tension: 0,
        pointRadius: 0,
      },
      {
        label: "Brake",
        data: brakeSeriesRef.current,
        fill: true,
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        borderColor: "#ef4444",
        borderWidth: 2,
        tension: 0,
        pointRadius: 0,
      },
    ],
  }), []);

  // Battery chart
  const batteryChartData = useMemo(() => ({
    labels: labelsRef.current,
    datasets: [
      {
        label: "BMS %",
        data: batterySeriesRef.current,
        fill: true,
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        borderColor: "#10b981",
        borderWidth: 2,
        tension: 0,
        pointRadius: 0,
      },
    ],
  }), []);

  return (
    <div className="telemetry-dashboard">
      {/* Header */}
      <header className="telemetry-header">
        <div className="header-left">
          <div className="session-info">
            <span className="session-label">LIVE SESSION</span>
            <div className={`session-status ${connected ? "connected" : "disconnected"}`}>
              <span className="status-indicator"></span>
              {connected ? "CONNECTED" : "DISCONNECTED"}
            </div>
          </div>
        </div>

        <div className="control-panel">
          {!connected ? (
            <button className="control-btn connect-btn" onClick={connectWebSocket}>
              <span>{"\u25B6"}</span>
              <span>CONNECT</span>
            </button>
          ) : (
            <button className="control-btn disconnect-btn" onClick={disconnectWebSocket}>
              <span>{"\u23F8"}</span>
              <span>DISCONNECT</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <div className="telemetry-grid">
        {/* Left Panel - Primary Stats */}
        <div className="left-panel">
          <div className="stat-panel primary-stat">
            <div className="stat-header">TIRE RPM</div>
            <div className="stat-value-large speed-value">{getSensorValue(5)}</div>
            <div className="stat-unit">rpm</div>
          </div>

          <div className="stat-panel primary-stat">
            <div className="stat-header">BMS %</div>
            <div className="stat-value-large battery-value">{getSensorValue(7)}</div>
            <div className="stat-unit">%</div>
          </div>

          <div className="secondary-stats">
            <div className="stat-panel secondary-stat">
              <div className="stat-header">THROTTLE 1</div>
              <div className="stat-value-medium">{getSensorValue(1)}</div>
              <div className="stat-unit">raw</div>
            </div>

            <div className="stat-panel secondary-stat">
              <div className="stat-header">THROTTLE 2</div>
              <div className="stat-value-medium">{getSensorValue(2)}</div>
              <div className="stat-unit">raw</div>
            </div>
          </div>

          <div className="secondary-stats">
            <div className="stat-panel secondary-stat">
              <div className="stat-header">BRAKE</div>
              <div className="stat-value-medium">{getSensorValue(3)}</div>
              <div className="stat-unit">raw</div>
            </div>

            <div className="stat-panel secondary-stat">
              <div className="stat-header">START SW</div>
              <div className="stat-value-medium">{getSensorValue(0)}</div>
              <div className="stat-unit">0/1</div>
            </div>
          </div>
        </div>

        {/* Center Panel - Charts */}
        <div className="center-panel">
          <div className="chart-section">
            <div className="section-header">TIRE RPM</div>
            <div className="chart-wrapper">
              <Line ref={rpmChartRef} data={rpmChartData} options={chartOptions} />
            </div>
          </div>

          <div className="chart-section">
            <div className="section-header">THROTTLE & BRAKE</div>
            <div className="chart-wrapper">
              <Line ref={throttleBrakeChartRef} data={throttleBrakeChartData} options={chartOptions} />
            </div>
          </div>

          <div className="chart-section">
            <div className="section-header">BMS %</div>
            <div className="chart-wrapper">
              <Line ref={batteryChartRef} data={batteryChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Right Panel - Additional Stats + Feed */}
        <div className="right-panel">
          <div className="stat-panel info-stat">
            <div className="stat-header">TIRE TEMP</div>
            <div className="stat-value-medium">{getSensorValue(6)}</div>
          </div>

          <div className="stat-panel info-stat">
            <div className="stat-header">BMS TEMP</div>
            <div className="stat-value-medium">{getSensorValue(8)}</div>
          </div>

          <div className="stat-panel info-stat">
            <div className="stat-header">RVC</div>
            <div className="stat-value-medium">{getSensorValue(4)}</div>
          </div>

          <div className="stat-panel info-stat">
            <div className="stat-header">GPS</div>
            <div className="stat-value-medium">{getSensorValue(9)}</div>
          </div>

          <div className="stat-panel info-stat">
            <div className="stat-header">LAP</div>
            <div className="stat-value-medium">{getSensorValue(10)}</div>
          </div>

          {/* Telemetry Feed */}
          <div className="telemetry-feed">
            <div className="feed-header">
              <div className="section-header">TELEMETRY FEED</div>
              <button
                type="button"
                className={`control-btn logging-toggle-btn ${loggingEnabled ? "connect-btn" : "disconnect-btn"}`}
                onClick={toggleLogging}
              >
                {loggingEnabled ? "LOGGING ON" : "LOGGING OFF"}
              </button>
            </div>
            <div className="feed-content">
              {logEntries.map((entry, index) => (
                <div key={index} className="log-entry">
                  <span className="log-time">{entry.timestamp}</span>
                  <span className="log-data">
                    <span className="log-sensor-name">{entry.sensor}</span>: {entry.data}
                  </span>
                </div>
              ))}
              {logEntries.length === 0 && (
                <div className="log-entry">
                  <span className="log-data">
                    {loggingEnabled ? "Waiting for telemetry data..." : "Logging paused"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveTelemetry;
