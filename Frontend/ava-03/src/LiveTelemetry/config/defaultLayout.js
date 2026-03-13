/**
 * Default layout configuration
 * This mirrors the current LiveTelemetry UI exactly
 */
export const DEFAULT_LAYOUT = {
  version: "1.0",
  layout: {
    leftPanel: [
      // Primary stats (large)
      {
        id: "stat-rpm",
        type: "stat",
        sensorId: 5,
        size: "large",
      },
      {
        id: "stat-bms",
        type: "stat",
        sensorId: 7,
        size: "large",
      },
      // Secondary stats (medium) - grouped in pairs
      {
        id: "stat-throttle1",
        type: "stat",
        sensorId: 1,
        size: "medium",
      },
      {
        id: "stat-throttle2",
        type: "stat",
        sensorId: 2,
        size: "medium",
      },
      {
        id: "stat-brake",
        type: "stat",
        sensorId: 3,
        size: "medium",
      },
      {
        id: "stat-start",
        type: "stat",
        sensorId: 0,
        size: "medium",
      },
    ],
    centerPanel: [
      {
        id: "chart-rpm",
        type: "chart",
        sensorIds: [5],
        title: "TIRE RPM",
        height: 180,
      },
      {
        id: "chart-throttle-brake",
        type: "chart",
        sensorIds: [1, 2, 3],
        title: "THROTTLE & BRAKE",
        height: 180,
      },
      {
        id: "chart-battery",
        type: "chart",
        sensorIds: [7],
        title: "BMS %",
        height: 180,
      },
    ],
    rightPanel: [
      // Info stats (small)
      {
        id: "stat-tire-temp",
        type: "stat",
        sensorId: 6,
        size: "small",
      },
      {
        id: "stat-bms-temp",
        type: "stat",
        sensorId: 8,
        size: "small",
      },
      {
        id: "stat-rvc",
        type: "stat",
        sensorId: 4,
        size: "small",
      },
      {
        id: "stat-gps",
        type: "stat",
        sensorId: 9,
        size: "small",
      },
      {
        id: "stat-lap",
        type: "stat",
        sensorId: 10,
        size: "small",
      },
      // Telemetry feed
      {
        id: "feed",
        type: "feed",
      },
    ],
  },
};
