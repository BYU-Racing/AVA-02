import { useState, useRef, useEffect } from "react";
import { getSensorConfig, getSensorName } from "../config/sensorConfig";
import { asBigIntArray, bigintToSafeNumber } from "../decode_data";

const TICK_TIME_MS = 100;

/**
 * Custom hook for managing telemetry data processing and handlers
 * @param {Function} onSampleUpdate - Callback when a sample value is updated (for charts)
 * @returns {Object} Telemetry data and handler utilities
 */
export function useTelemetryHandlers(onSampleUpdate) {
  const [telemetryData, setTelemetryData] = useState({});

  // Buffered latest values
  const latestRef = useRef({});
  const latestDirtyRef = useRef(false);

  // Performance counters
  const perfCountersRef = useRef({
    messagesProcessed: 0,
    telemetryStateCommits: 0,
  });

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

  // Stub for log entries (kept for compatibility)
  const enqueueLogEntry = () => {};

  // Update sample value (for charts)
  const updateSample = (key, value) => {
    if (onSampleUpdate) {
      onSampleUpdate(key, value);
    }
  };

  // Handle incoming telemetry message
  const handleTelemetryMessage = (msg) => {
    const id = Number(msg.id);
    if (!Number.isFinite(id)) return;

    perfCountersRef.current.messagesProcessed += 1;

    const ts = msg.timestamp || new Date().toISOString();
    const name = getSensorName(id);
    const config = getSensorConfig(id);

    const utilities = {
      updateLatest,
      enqueueLog: enqueueLogEntry,
      updateSample,
    };

    if (config && config.handler) {
      // Use configured handler
      config.handler({ id, name, data: msg.data, ts }, utilities);
    } else {
      // Default: single scalar value
      const [v] = asBigIntArray(msg.data);
      const n = bigintToSafeNumber(v);
      updateLatest(id, name, n, ts);
      enqueueLogEntry(name, `${v.toString()}`);
    }
  };

  // Commit buffered telemetry data to React state periodically
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

  // Get sensor value by ID
  const getSensorValue = (msgId) => telemetryData[msgId]?.value ?? 0;

  return {
    telemetryData,
    handleTelemetryMessage,
    getSensorValue,
    perfCounters: perfCountersRef.current,
  };
}
