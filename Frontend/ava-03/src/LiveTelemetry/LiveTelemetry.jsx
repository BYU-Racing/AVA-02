import React, { useState, useEffect, useRef, useMemo, memo } from "react";
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
const MemoLine = memo(Line);

// Configuration
// Same-host websocket URL (works on EC2, EB, and behind Cloudflare)
const WS_URL = (import.meta.env.VITE_WS_URL?.trim()) // Manual override via enc var
  ? import.meta.env.VITE_WS_URL.trim()
  : (() => { // Auto-detect ws/wss based on page protocol
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/api/ws/livetelemetry`;
})();
const RECONNECT_INTERVAL = 3000;
const MAX_DATA_POINTS = 40;
const MAX_LOG_ENTRIES = 20;
const TICK_TIME_MS = 100;
const LOG_FLUSH_TIME_MS = 250;
const ANIMATION_TIME = TICK_TIME_MS/2;

// Choose one ID to advance chart timestamps (prevents x-axis drift)
// Good defaults: TireRPM (5) or Throttle1 (1)
const CHART_TICK_ID = 3;

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
  const [lastMessageTime, setLastMessageTime] = useState(null);

  // Latest telemetry per ID
  const [telemetryData, setTelemetryData] = useState({});
  const [logEntries, setLogEntries] = useState([]);
  const [loggingEnabled, setLoggingEnabled] = useState(true);

  // Chart series + labels
  const [rpmData, setRpmData] = useState([]); // TireRPM
  const [throttleBrakeData, setThrottleBrakeData] = useState({
    throttle1: [],
    throttle2: [],
    brake: [],
  });
  const [batteryData, setBatteryData] = useState([]); // BMSPercentage
  const [timestamps, setTimestamps] = useState([]);

  // WebSocket refs
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const logQueueRef = useRef([]);
  const loggingEnabledRef = useRef(true);
  const latestDirtyRef = useRef(false);
  const rpmDirtyRef = useRef(false);
  const throttleBrakeDirtyRef = useRef(false);
  const batteryDirtyRef = useRef(false);
  const timestampsDirtyRef = useRef(false);

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

  const lastTickRef = useRef(0);

  // Advance chart x-axis
  const tickCharts = () => {
    const now = performance.now();
    if(now - lastTickRef.current < TICK_TIME_MS) return; // throttle to 10 ticks/sec
    lastTickRef.current = now;

    timestampsRef.current = [...timestampsRef.current.slice(-MAX_DATA_POINTS + 1), 
                            new Date().toLocaleTimeString()];
    timestampsDirtyRef.current = true;
  };

  // Update latest-value store (for stat panels)
  const updateLatest = (id, name, displayValue, ts) => {
    latestRef.current[id] = {
       name, value: displayValue, timestamp: ts,
    };
    latestDirtyRef.current = true;
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

      throttleBrakeRef.current = {...throttleBrakeRef.current,
        throttle1: [...throttleBrakeRef.current.throttle1.slice(-MAX_DATA_POINTS + 1), n],
      };
      throttleBrakeDirtyRef.current = true;
      // setThrottleBrakeData((prev) => ({
      //   ...prev,
      //   throttle1: [...prev.throttle1.slice(-MAX_DATA_POINTS + 1), n],
      // }));

      if (id === CHART_TICK_ID) tickCharts();
      enqueueLogEntry(name, `${v.toString()}`);
    },

    2: ({ id, name, data, ts }) => {
      // Throttle2Position
      const [v] = asBigIntArray(data);
      const n = bigintToSafeNumber(v);
      updateLatest(id, name, n, ts);

      throttleBrakeRef.current = {...throttleBrakeRef.current,
        throttle2: [...throttleBrakeRef.current.throttle2.slice(-MAX_DATA_POINTS + 1), n],
      };
      throttleBrakeDirtyRef.current = true;
      // setThrottleBrakeData((prev) => ({
      //   ...prev,
      //   throttle2: [...prev.throttle2.slice(-MAX_DATA_POINTS + 1), n],
      // }));

      if (id === CHART_TICK_ID) tickCharts();
      enqueueLogEntry(name, `${v.toString()}`);
    },

    3: ({ id, name, data, ts }) => {
      // BrakePressure
      const [v] = asBigIntArray(data);
      const n = bigintToSafeNumber(v);
      updateLatest(id, name, n, ts);

      throttleBrakeRef.current = {...throttleBrakeRef.current,
        brake: [...throttleBrakeRef.current.brake.slice(-MAX_DATA_POINTS + 1), n],
      };
      throttleBrakeDirtyRef.current = true;

      if (id === CHART_TICK_ID) tickCharts();
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

      rpmRef.current = [...rpmRef.current.slice(-MAX_DATA_POINTS + 1), rpm];
      rpmDirtyRef.current = true;
      // setRpmData((prev) => [...prev.slice(-MAX_DATA_POINTS + 1), rpm]);

      if (id === CHART_TICK_ID) tickCharts();
      enqueueLogEntry(name, JSON.stringify(vals.map(v=>bigintToSafeNumber(v))));
    },

    6: ({ id, name, data, ts }) => {
      // TireTemperature
      const vals = asBigIntArray(data);
      const wheel = bigintToSafeNumber(vals[0] ?? 0n);
      const tempIn  = bigintToSafeNumber(vals[1] ?? 0n);
      const tempOut = bigintToSafeNumber(vals[2] ?? 0n);
      const tempCore = bigintToSafeNumber(vals[3] ?? 0n);
      const labels = ["FL","FR","RL","RR"];
      const display = `${labels[wheel] ?? "?"}=${tempIn}°C/${tempCore}°C/${tempOut}°C`;
      updateLatest(id, name, display, ts);
      enqueueLogEntry(name, display);
    },

    7: ({ id, name, data, ts }) => {
      // BMSPercentage (0-100)
      const [v] = asBigIntArray(data);
      const pct = bigintToSafeNumber(v);
      updateLatest(id, name, pct, ts);

      batteryRef.current = [...batteryRef.current.slice(-MAX_DATA_POINTS + 1), pct];
      batteryDirtyRef.current = true;
      // setBatteryData((prev) => [...prev.slice(-MAX_DATA_POINTS + 1), pct]);

      if (id === CHART_TICK_ID) tickCharts();
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

          setLastMessageTime(new Date());
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

  // Buffered arrays for charts to prevent re-rendering on every message
  const latestRef = useRef({});
  const rpmRef = useRef([]);
  const throttleBrakeRef = useRef({ 
    throttle1: [], throttle2: [], brake: [] });
  const batteryRef = useRef([]);
  const timestampsRef = useRef([]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Only push state updates when underlying refs changed.
      if (latestDirtyRef.current) {
        setTelemetryData({ ...latestRef.current });
        latestDirtyRef.current = false;
      }
      if (rpmDirtyRef.current) {
        setRpmData([...rpmRef.current]);
        rpmDirtyRef.current = false;
      }
      if (throttleBrakeDirtyRef.current) {
        setThrottleBrakeData({
          throttle1: [...throttleBrakeRef.current.throttle1],
          throttle2: [...throttleBrakeRef.current.throttle2],
          brake: [...throttleBrakeRef.current.brake],
        });
        throttleBrakeDirtyRef.current = false;
      }
      if (batteryDirtyRef.current) {
        setBatteryData([...batteryRef.current]);
        batteryDirtyRef.current = false;
      }
      if (timestampsDirtyRef.current) {
        setTimestamps([...timestampsRef.current]);
        timestampsDirtyRef.current = false;
      }
    }, TICK_TIME_MS);

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
    transitions: {
      active: { animation: { duration: 0 } },
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
    labels: timestamps,
    datasets: [
      {
        label: "Tire RPM",
        data: rpmData,
        fill: true,
        backgroundColor: "rgba(0, 217, 255, 0.1)",
        borderColor: "#00d9ff",
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  }), [timestamps, rpmData]);

  // Throttle & Brake chart
  const throttleBrakeChartData = useMemo(() => ({
    labels: timestamps,
    datasets: [
      {
        label: "Throttle 1",
        data: throttleBrakeData.throttle1,
        fill: true,
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        borderColor: "#10b981",
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: "Throttle 2",
        data: throttleBrakeData.throttle2,
        fill: true,
        backgroundColor: "rgba(59, 130, 246, 0.08)",
        borderColor: "#3b82f6",
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: "Brake",
        data: throttleBrakeData.brake,
        fill: true,
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        borderColor: "#ef4444",
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  }), [timestamps, throttleBrakeData]);

  // Battery chart
  const batteryChartData = useMemo(() => ({
    labels: timestamps,
    datasets: [
      {
        label: "BMS %",
        data: batteryData,
        fill: true,
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        borderColor: "#10b981",
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  }), [timestamps, batteryData]);

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
              <span>▶</span>
              <span>CONNECT</span>
            </button>
          ) : (
            <button className="control-btn disconnect-btn" onClick={disconnectWebSocket}>
              <span>⏸</span>
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
              <MemoLine data={rpmChartData} options={chartOptions} />
            </div>
          </div>

          <div className="chart-section">
            <div className="section-header">THROTTLE & BRAKE</div>
            <div className="chart-wrapper">
              <MemoLine data={throttleBrakeChartData} options={chartOptions} />
            </div>
          </div>

          <div className="chart-section">
            <div className="section-header">BMS %</div>
            <div className="chart-wrapper">
              <MemoLine data={batteryChartData} options={chartOptions} />
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
