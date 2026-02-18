import React, { useState, useEffect, useRef } from "react";
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
const WS_URL = "ws://ava-02.us-east-2.elasticbeanstalk.com/api/ws/livetelemetry";
const RECONNECT_INTERVAL = 3000;
const MAX_DATA_POINTS = 50;
const MAX_LOG_ENTRIES = 30;

// Choose one ID to advance chart timestamps (prevents x-axis drift)
// Good defaults: TireRPM (5) or Throttle1 (1)
const CHART_TICK_ID = 5;

// Fallback names if idMap doesn't include them
const ID_NAME = {
  0: "StartSwitch",
  1: "Throttle1Position",
  2: "Throttle2Position",
  3: "BrakePressure",
  4: "RVC",
  5: "TireRPM",
  6: "TireTemperature",
  7: "BMSPercentage",
  8: "BMSTemperature",
  9: "GPS",
  10: "Lap",
};

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

  // Add entry to telemetry feed
  const addLogEntry = (sensor, data) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogEntries((prev) => [
      { timestamp, sensor, data },
      ...prev.slice(0, MAX_LOG_ENTRIES - 1),
    ]);
  };

  // Advance chart x-axis
  const tickCharts = () => {
    setTimestamps((prev) => {
      const next = [...prev, new Date().toLocaleTimeString()];
      return next.slice(-MAX_DATA_POINTS);
    });
  };

  // Update latest-value store (for stat panels)
  const updateLatest = (id, name, displayValue, ts) => {
    setTelemetryData((prev) => ({
      ...prev,
      [id]: { name, value: displayValue, timestamp: ts },
    }));
  };

  // ---------- ID-specific handlers ----------
  // Each handler receives: { id, name, data, ts }
  const handlers = {
    0: ({ id, name, data, ts }) => {
      // StartSwitch: 0/1
      const [v] = asBigIntArray(data);
      const n = bigintToSafeNumber(v);
      updateLatest(id, name, n, ts);
      addLogEntry(name, `${n}`);
    },

    1: ({ id, name, data, ts }) => {
      // Throttle1Position (raw or %)
      const [v] = asBigIntArray(data);
      const n = bigintToSafeNumber(v);
      updateLatest(id, name, n, ts);

      setThrottleBrakeData((prev) => ({
        ...prev,
        throttle1: [...prev.throttle1.slice(-MAX_DATA_POINTS + 1), n],
      }));

      if (id === CHART_TICK_ID) tickCharts();
      addLogEntry(name, `${v.toString()}`);
    },

    2: ({ id, name, data, ts }) => {
      // Throttle2Position
      const [v] = asBigIntArray(data);
      const n = bigintToSafeNumber(v);
      updateLatest(id, name, n, ts);

      setThrottleBrakeData((prev) => ({
        ...prev,
        throttle2: [...prev.throttle2.slice(-MAX_DATA_POINTS + 1), n],
      }));

      if (id === CHART_TICK_ID) tickCharts();
      addLogEntry(name, `${v.toString()}`);
    },

    3: ({ id, name, data, ts }) => {
      // BrakePressure
      const [v] = asBigIntArray(data);
      const n = bigintToSafeNumber(v);
      updateLatest(id, name, n, ts);

      setThrottleBrakeData((prev) => ({
        ...prev,
        brake: [...prev.brake.slice(-MAX_DATA_POINTS + 1), n],
      }));

      if (id === CHART_TICK_ID) tickCharts();
      addLogEntry(name, `${v.toString()}`);
    },

    4: ({ id, name, data, ts }) => {
      // RVC (whatever scalar you use)
      const [v] = asBigIntArray(data);
      const n = bigintToSafeNumber(v);
      updateLatest(id, name, n, ts);
      addLogEntry(name, `${v.toString()}`);
    },

    5: ({ id, name, data, ts }) => {
      // TireRPM
      const [v] = asBigIntArray(data);
      const rpm = bigintToSafeNumber(v);
      updateLatest(id, name, rpm, ts);

      setRpmData((prev) => [...prev.slice(-MAX_DATA_POINTS + 1), rpm]);

      if (id === CHART_TICK_ID) tickCharts();
      addLogEntry(name, `${v.toString()}`);
    },

    6: ({ id, name, data, ts }) => {
      // TireTemperature (scalar or array if you later add multiple tires)
      // If later you send [FL, FR, RL, RR], this will still work and show a summary.
      const vals = asBigIntArray(data);
      const nums = vals.map(bigintToSafeNumber);

      const display =
        nums.length <= 1
          ? nums[0] ?? 0
          : `FL=${nums[0] ?? 0} FR=${nums[1] ?? 0} RL=${nums[2] ?? 0} RR=${
              nums[3] ?? 0
            }`;

      updateLatest(id, name, display, ts);
      addLogEntry(name, Array.isArray(data) ? JSON.stringify(nums) : `${nums[0] ?? 0}`);
    },

    7: ({ id, name, data, ts }) => {
      // BMSPercentage (0-100)
      const [v] = asBigIntArray(data);
      const pct = bigintToSafeNumber(v);
      updateLatest(id, name, pct, ts);

      setBatteryData((prev) => [...prev.slice(-MAX_DATA_POINTS + 1), pct]);

      if (id === CHART_TICK_ID) tickCharts();
      addLogEntry(name, `${v.toString()}`);
    },

    8: ({ id, name, data, ts }) => {
      // BMSTemperature
      const [v] = asBigIntArray(data);
      const temp = bigintToSafeNumber(v);
      updateLatest(id, name, temp, ts);
      addLogEntry(name, `${v.toString()}`);
    },

    9: ({ id, name, data, ts }) => {
      // GPS — assume [lat_e7, lon_e7, speed_cms] as ints in strings
      // Adjust decoding to your actual format.
      const vals = asBigIntArray(data);
      const lat_e7 = vals[0] ?? 0n;
      const lon_e7 = vals[1] ?? 0n;
      const spd_cms = vals[2] ?? 0n;

      const lat = Number(lat_e7) / 1e7;
      const lon = Number(lon_e7) / 1e7;
      const spd_ms = Number(spd_cms) / 100; // cm/s -> m/s

      // If lat/lon might exceed safe integer conversion, keep them as strings; but e7 values are typically safe.
      const display = `lat=${lat.toFixed(6)} lon=${lon.toFixed(6)} v=${spd_ms.toFixed(2)}m/s`;

      updateLatest(id, name, display, ts);
      addLogEntry(name, display);
    },

    10: ({ id, name, data, ts }) => {
      // Lap
      const [v] = asBigIntArray(data);
      const lap = bigintToSafeNumber(v);
      updateLatest(id, name, lap, ts);
      addLogEntry(name, `${v.toString()}`);
    },
  };

  // ---------- Router ----------
  const handleTelemetryMessage = (msg) => {
    const id = Number(msg.id);
    if (!Number.isFinite(id)) return;

    const ts = msg.timestamp || new Date().toISOString();
    const name = idMap?.[id] || ID_NAME[id] || `Sensor ${id}`;
    const fn = handlers[id];

    if (fn) {
      fn({ id, name, data: msg.data, ts });
    } else {
      // Default: single scalar
      const [v] = asBigIntArray(msg.data);
      const n = bigintToSafeNumber(v);
      updateLatest(id, name, n, ts);
      addLogEntry(name, `${v.toString()}`);
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
        addLogEntry("SYSTEM", "Connected to telemetry stream");
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
        addLogEntry("SYSTEM", "Disconnected from telemetry stream");

        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("Attempting to reconnect...");
          connectWebSocket();
        }, RECONNECT_INTERVAL);
      };

      wsRef.current = ws;
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
  };

  // Auto-connect on mount
  useEffect(() => {
    connectWebSocket();
    return () => disconnectWebSocket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // UI helper: get latest value for id
  const getSensorValue = (msgId) => telemetryData[msgId]?.value ?? 0;

  // ---------- Chart options ----------
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
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
  };

  // Tire RPM chart
  const rpmChartData = {
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
  };

  // Throttle & Brake chart
  const throttleBrakeChartData = {
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
  };

  // Battery chart
  const batteryChartData = {
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
  };

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
              <Line data={rpmChartData} options={chartOptions} />
            </div>
          </div>

          <div className="chart-section">
            <div className="section-header">THROTTLE & BRAKE</div>
            <div className="chart-wrapper">
              <Line data={throttleBrakeChartData} options={chartOptions} />
            </div>
          </div>

          <div className="chart-section">
            <div className="section-header">BMS %</div>
            <div className="chart-wrapper">
              <Line data={batteryChartData} options={chartOptions} />
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
            <div className="section-header">TELEMETRY FEED</div>
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
                  <span className="log-data">Waiting for telemetry data...</span>
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
