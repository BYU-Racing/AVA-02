import React from "react";
import { getSensorConfig } from "../../config/sensorConfig";

/**
 * StatWidget - Displays a single sensor value
 * @param {Object} props
 * @param {number} props.sensorId - Sensor ID to display
 * @param {string} props.size - Widget size (small, medium, large)
 * @param {Function} props.getSensorValue - Function to get current sensor value
 */
export function StatWidget({ sensorId, size, getSensorValue }) {
  const config = getSensorConfig(sensorId);
  const value = getSensorValue(sensorId);

  if (!config) {
    return null;
  }

  const formatValue = (val) => {
    if (Array.isArray(val)) return val.join(", ");
    if (val === null || val === undefined) return "-";
    return String(val);
  };

  // Map size to CSS class names
  const sizeClassMap = {
    large: "stat-panel primary-stat",
    medium: "stat-panel secondary-stat",
    small: "stat-panel info-stat",
  };

  const panelClass = sizeClassMap[size] || "stat-panel";

  // Value display class based on sensor type
  let valueClass = "stat-value-medium";
  if (size === "large") {
    if (sensorId === 5) valueClass = "stat-value-large speed-value";
    else if (sensorId === 7) valueClass = "stat-value-large battery-value";
    else valueClass = "stat-value-large";
  }

  return (
    <div className={panelClass}>
      <div className="stat-header">{config.displayName}</div>
      <div className={valueClass}>{formatValue(value)}</div>
      {config.unit && <div className="stat-unit">{config.unit}</div>}
    </div>
  );
}
