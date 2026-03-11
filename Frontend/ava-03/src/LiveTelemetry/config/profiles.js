/**
 * Team Profile Configurations
 * Predefined layouts for different team roles
 */

export const TEAM_PROFILES = {
  default: {
    name: "Default",
    description: "Standard dashboard with all sensors",
    layout: {
      leftPanel: [
        { id: "stat-rpm", type: "stat", sensorId: 5, size: "large" },
        { id: "stat-bms", type: "stat", sensorId: 7, size: "large" },
        { id: "stat-throttle1", type: "stat", sensorId: 1, size: "medium" },
        { id: "stat-throttle2", type: "stat", sensorId: 2, size: "medium" },
        { id: "stat-brake", type: "stat", sensorId: 3, size: "medium" },
        { id: "stat-start", type: "stat", sensorId: 0, size: "medium" },
      ],
      centerPanel: [
        { id: "chart-rpm", type: "chart", sensorIds: [5], title: "TIRE RPM", height: 180 },
        { id: "chart-throttle-brake", type: "chart", sensorIds: [1, 2, 3], title: "THROTTLE & BRAKE", height: 180 },
        { id: "chart-battery", type: "chart", sensorIds: [7], title: "BMS %", height: 180 },
      ],
      rightPanel: [
        { id: "stat-tire-temp", type: "stat", sensorId: 6, size: "small" },
        { id: "stat-bms-temp", type: "stat", sensorId: 8, size: "small" },
        { id: "stat-rvc", type: "stat", sensorId: 4, size: "small" },
        { id: "stat-gps", type: "stat", sensorId: 9, size: "small" },
        { id: "stat-lap", type: "stat", sensorId: 10, size: "small" },
        { id: "feed", type: "feed" },
      ],
    },
  },

  controls: {
    name: "Controls Team",
    description: "Focus on throttle, brake, and RPM",
    layout: {
      leftPanel: [
        { id: "stat-throttle1", type: "stat", sensorId: 1, size: "large" },
        { id: "stat-throttle2", type: "stat", sensorId: 2, size: "large" },
        { id: "stat-brake", type: "stat", sensorId: 3, size: "large" },
        { id: "stat-rpm", type: "stat", sensorId: 5, size: "medium" },
        { id: "stat-start", type: "stat", sensorId: 0, size: "medium" },
      ],
      centerPanel: [
        { id: "chart-throttle-brake", type: "chart", sensorIds: [1, 2, 3], title: "THROTTLE & BRAKE", height: 240 },
        { id: "chart-rpm", type: "chart", sensorIds: [5], title: "TIRE RPM", height: 200 },
      ],
      rightPanel: [
        { id: "stat-rvc", type: "stat", sensorId: 4, size: "small" },
        { id: "stat-tire-temp", type: "stat", sensorId: 6, size: "small" },
        { id: "feed", type: "feed" },
      ],
    },
  },

  battery: {
    name: "Battery Team",
    description: "Focus on BMS and power systems",
    layout: {
      leftPanel: [
        { id: "stat-bms", type: "stat", sensorId: 7, size: "large" },
        { id: "stat-bms-temp", type: "stat", sensorId: 8, size: "large" },
        { id: "stat-rpm", type: "stat", sensorId: 5, size: "medium" },
        { id: "stat-throttle1", type: "stat", sensorId: 1, size: "medium" },
      ],
      centerPanel: [
        { id: "chart-battery", type: "chart", sensorIds: [7], title: "BMS %", height: 280 },
        { id: "chart-rpm", type: "chart", sensorIds: [5], title: "TIRE RPM", height: 160 },
      ],
      rightPanel: [
        { id: "stat-tire-temp", type: "stat", sensorId: 6, size: "small" },
        { id: "feed", type: "feed" },
      ],
    },
  },

  driver: {
    name: "Driver/Cockpit",
    description: "Essential driver information",
    layout: {
      leftPanel: [
        { id: "stat-rpm", type: "stat", sensorId: 5, size: "large" },
        { id: "stat-bms", type: "stat", sensorId: 7, size: "large" },
        { id: "stat-lap", type: "stat", sensorId: 10, size: "large" },
      ],
      centerPanel: [
        { id: "chart-rpm", type: "chart", sensorIds: [5], title: "TIRE RPM", height: 200 },
        { id: "chart-battery", type: "chart", sensorIds: [7], title: "BMS %", height: 200 },
      ],
      rightPanel: [
        { id: "stat-tire-temp", type: "stat", sensorId: 6, size: "small" },
        { id: "stat-bms-temp", type: "stat", sensorId: 8, size: "small" },
        { id: "stat-gps", type: "stat", sensorId: 9, size: "small" },
        { id: "feed", type: "feed" },
      ],
    },
  },

  analytics: {
    name: "Data/Analytics",
    description: "Comprehensive view of all sensors",
    layout: {
      leftPanel: [
        { id: "stat-rpm", type: "stat", sensorId: 5, size: "medium" },
        { id: "stat-bms", type: "stat", sensorId: 7, size: "medium" },
        { id: "stat-throttle1", type: "stat", sensorId: 1, size: "medium" },
        { id: "stat-throttle2", type: "stat", sensorId: 2, size: "medium" },
        { id: "stat-brake", type: "stat", sensorId: 3, size: "medium" },
        { id: "stat-start", type: "stat", sensorId: 0, size: "medium" },
      ],
      centerPanel: [
        { id: "chart-rpm", type: "chart", sensorIds: [5], title: "TIRE RPM", height: 150 },
        { id: "chart-throttle-brake", type: "chart", sensorIds: [1, 2, 3], title: "THROTTLE & BRAKE", height: 150 },
        { id: "chart-battery", type: "chart", sensorIds: [7], title: "BMS %", height: 150 },
      ],
      rightPanel: [
        { id: "stat-tire-temp", type: "stat", sensorId: 6, size: "small" },
        { id: "stat-bms-temp", type: "stat", sensorId: 8, size: "small" },
        { id: "stat-rvc", type: "stat", sensorId: 4, size: "small" },
        { id: "stat-gps", type: "stat", sensorId: 9, size: "small" },
        { id: "stat-lap", type: "stat", sensorId: 10, size: "small" },
        { id: "feed", type: "feed" },
      ],
    },
  },

  minimal: {
    name: "Minimal",
    description: "Essential sensors only",
    layout: {
      leftPanel: [
        { id: "stat-rpm", type: "stat", sensorId: 5, size: "large" },
        { id: "stat-bms", type: "stat", sensorId: 7, size: "large" },
      ],
      centerPanel: [
        { id: "chart-rpm", type: "chart", sensorIds: [5], title: "TIRE RPM", height: 220 },
        { id: "chart-battery", type: "chart", sensorIds: [7], title: "BMS %", height: 220 },
      ],
      rightPanel: [
        { id: "feed", type: "feed" },
      ],
    },
  },
};

/**
 * Get all available profiles
 */
export function getAvailableProfiles() {
  return Object.entries(TEAM_PROFILES).map(([key, profile]) => ({
    key,
    ...profile,
  }));
}

/**
 * Get profile by key
 */
export function getProfile(key) {
  return TEAM_PROFILES[key];
}
