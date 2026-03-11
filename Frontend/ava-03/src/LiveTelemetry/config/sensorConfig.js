import { asBigIntArray, bigintToSafeNumber } from "../decode_data";
import idMap from "../../idMap";

/**
 * Sensor configuration with handlers and metadata
 * Each sensor ID maps to its processing logic and display properties
 */
export const SENSOR_CONFIGS = {
  0: {
    id: 0,
    name: "StartSwitch",
    displayName: "START SW",
    unit: "0/1",
    supportedWidgets: ["stat"],
    isDefault: true,
    size: "medium",
    panel: "left",
    handler: ({ id, name, data, ts }, { updateLatest, enqueueLog }) => {
      const [v] = asBigIntArray(data);
      const n = bigintToSafeNumber(v);
      updateLatest(id, name, n, ts);
      enqueueLog(name, `${n}`);
    },
  },

  1: {
    id: 1,
    name: "Throttle1Position",
    displayName: "THROTTLE 1",
    unit: "raw",
    supportedWidgets: ["stat", "chart"],
    isDefault: true,
    size: "medium",
    panel: "left",
    chartable: true,
    color: "#10b981",
    chartKey: "throttle1",
    handler: ({ id, name, data, ts }, { updateLatest, enqueueLog, updateSample }) => {
      const [v] = asBigIntArray(data);
      const n = bigintToSafeNumber(v);
      updateLatest(id, name, n, ts);
      updateSample("throttle1", n);
      enqueueLog(name, `${v.toString()}`);
    },
  },

  2: {
    id: 2,
    name: "Throttle2Position",
    displayName: "THROTTLE 2",
    unit: "raw",
    supportedWidgets: ["stat", "chart"],
    isDefault: true,
    size: "medium",
    panel: "left",
    chartable: true,
    color: "#3b82f6",
    chartKey: "throttle2",
    handler: ({ id, name, data, ts }, { updateLatest, enqueueLog, updateSample }) => {
      const [v] = asBigIntArray(data);
      const n = bigintToSafeNumber(v);
      updateLatest(id, name, n, ts);
      updateSample("throttle2", n);
      enqueueLog(name, `${v.toString()}`);
    },
  },

  3: {
    id: 3,
    name: "BrakePressure",
    displayName: "BRAKE",
    unit: "raw",
    supportedWidgets: ["stat", "chart"],
    isDefault: true,
    size: "medium",
    panel: "left",
    chartable: true,
    color: "#ef4444",
    chartKey: "brake",
    handler: ({ id, name, data, ts }, { updateLatest, enqueueLog, updateSample }) => {
      const [v] = asBigIntArray(data);
      const n = bigintToSafeNumber(v);
      updateLatest(id, name, n, ts);
      updateSample("brake", n);
      enqueueLog(name, `${v.toString()}`);
    },
  },

  4: {
    id: 4,
    name: "RVC",
    displayName: "RVC",
    unit: "",
    supportedWidgets: ["stat"],
    isDefault: true,
    size: "small",
    panel: "right",
    handler: ({ id, name, data, ts }, { updateLatest, enqueueLog }) => {
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
      enqueueLog(name, `${display}`);
    },
  },

  5: {
    id: 5,
    name: "TireRPM",
    displayName: "TIRE RPM",
    unit: "rpm",
    supportedWidgets: ["stat", "chart"],
    isDefault: true,
    size: "large",
    panel: "left",
    chartable: true,
    color: "#00d9ff",
    chartKey: "rpm",
    handler: ({ id, name, data, ts }, { updateLatest, enqueueLog, updateSample }) => {
      const vals = asBigIntArray(data);
      const rpm = bigintToSafeNumber(vals[1] ?? 0n);
      updateLatest(id, name, rpm, ts);
      updateSample("rpm", rpm);
      enqueueLog(name, JSON.stringify(vals.map((v) => bigintToSafeNumber(v))));
    },
  },

  6: {
    id: 6,
    name: "TireTemperature",
    displayName: "TIRE TEMP",
    unit: "",
    supportedWidgets: ["stat"],
    isDefault: true,
    size: "small",
    panel: "right",
    handler: ({ id, name, data, ts }, { updateLatest, enqueueLog }) => {
      const vals = asBigIntArray(data);
      const wheel = bigintToSafeNumber(vals[0] ?? 0n);
      const tempIn = bigintToSafeNumber(vals[1] ?? 0n);
      const tempOut = bigintToSafeNumber(vals[2] ?? 0n);
      const tempCore = bigintToSafeNumber(vals[3] ?? 0n);
      const labels = ["FL", "FR", "RL", "RR"];
      const display = `${labels[wheel] ?? "?"}=${tempIn}\u00B0C/${tempCore}\u00B0C/${tempOut}\u00B0C`;
      updateLatest(id, name, display, ts);
      enqueueLog(name, display);
    },
  },

  7: {
    id: 7,
    name: "BMSPercentage",
    displayName: "BMS %",
    unit: "%",
    supportedWidgets: ["stat", "chart"],
    isDefault: true,
    size: "large",
    panel: "left",
    chartable: true,
    color: "#10b981",
    chartKey: "battery",
    handler: ({ id, name, data, ts }, { updateLatest, enqueueLog, updateSample }) => {
      const [v] = asBigIntArray(data);
      const pct = bigintToSafeNumber(v);
      updateLatest(id, name, pct, ts);
      updateSample("battery", pct);
      enqueueLog(name, `${v.toString()}`);
    },
  },

  8: {
    id: 8,
    name: "BMSTemperature",
    displayName: "BMS TEMP",
    unit: "",
    supportedWidgets: ["stat"],
    isDefault: true,
    size: "small",
    panel: "right",
    handler: ({ id, name, data, ts }, { updateLatest, enqueueLog }) => {
      const [v] = asBigIntArray(data);
      const temp = bigintToSafeNumber(v);
      updateLatest(id, name, temp, ts);
      enqueueLog(name, `${v.toString()}`);
    },
  },

  9: {
    id: 9,
    name: "GPS",
    displayName: "GPS",
    unit: "",
    supportedWidgets: ["stat"],
    isDefault: true,
    size: "small",
    panel: "right",
    handler: ({ id, name, data, ts }, { updateLatest, enqueueLog }) => {
      const vals = asBigIntArray(data);
      const lat = Number(vals[0] ?? 0n) / 1e7;
      const lon = Number(vals[1] ?? 0n) / 1e7;
      const display = `lat=${lat.toFixed(6)} lon=${lon.toFixed(6)}`;
      updateLatest(id, name, display, ts);
      enqueueLog(name, display);
    },
  },

  10: {
    id: 10,
    name: "Lap",
    displayName: "LAP",
    unit: "",
    supportedWidgets: ["stat"],
    isDefault: true,
    size: "small",
    panel: "right",
    handler: ({ id, name, data, ts }, { updateLatest, enqueueLog }) => {
      const [v] = asBigIntArray(data);
      const lap = bigintToSafeNumber(v);
      updateLatest(id, name, lap, ts);
      enqueueLog(name, `${v.toString()}`);
    },
  },
};

/**
 * Get sensor configuration by ID
 */
export function getSensorConfig(id) {
  return SENSOR_CONFIGS[id];
}

/**
 * Get sensor name from idMap or config
 */
export function getSensorName(id) {
  return idMap?.[id] || SENSOR_CONFIGS[id]?.name || `Sensor ${id}`;
}

/**
 * Get all chartable sensors
 */
export function getChartableSensors() {
  return Object.values(SENSOR_CONFIGS).filter((config) => config.chartable);
}

/**
 * Get default sensors for a specific panel
 */
export function getDefaultSensorsForPanel(panel) {
  return Object.values(SENSOR_CONFIGS).filter(
    (config) => config.isDefault && config.panel === panel
  );
}
