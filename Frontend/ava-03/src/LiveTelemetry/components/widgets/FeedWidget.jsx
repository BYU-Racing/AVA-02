import React, { useMemo } from "react";

/**
 * FeedWidget - Displays latest telemetry data from all sensors
 * @param {Object} props
 * @param {Object} props.telemetryData - Latest telemetry values
 */
export function FeedWidget({ telemetryData }) {
  const latestTelemetryById = useMemo(
    () =>
      Object.entries(telemetryData)
        .map(([id, entry]) => ({
          id: Number(id),
          name: entry.name,
          value: entry.value,
          timestamp: entry.timestamp,
        }))
        .sort((a, b) => a.id - b.id),
    [telemetryData]
  );

  const formatLatestValue = (value) => {
    if (Array.isArray(value)) return value.join(", ");
    if (value === null || value === undefined) return "-";
    return String(value);
  };

  return (
    <div className="telemetry-feed">
      <div className="feed-header">
        <div className="section-header">LATEST IDS</div>
      </div>
      <div className="feed-content">
        {latestTelemetryById.map((entry) => (
          <div key={entry.id} className="log-entry">
            <span className="log-time">ID {entry.id}</span>
            <span className="log-data">
              <span className="log-sensor-name">{entry.name}</span>:{" "}
              {formatLatestValue(entry.value)}
            </span>
          </div>
        ))}
        {latestTelemetryById.length === 0 && (
          <div className="log-entry">
            <span className="log-data">Waiting for telemetry data...</span>
          </div>
        )}
      </div>
    </div>
  );
}
