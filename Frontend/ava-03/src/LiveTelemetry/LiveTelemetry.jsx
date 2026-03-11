import React from "react";
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
import "./LiveTelemetry.css";
import { useWebSocketTelemetry } from "./hooks/useWebSocketTelemetry";
import { useTelemetryHandlers } from "./hooks/useTelemetryHandlers";
import { useChartSeries } from "./hooks/useChartSeries";
import { useWidgetPreferences } from "./hooks/useWidgetPreferences";
import { TelemetryLayout } from "./components/TelemetryLayout";
import { WidgetConfigurator } from "./components/WidgetConfigurator";
import { DEFAULT_LAYOUT } from "./config/defaultLayout";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
);

// Configuration moved to hooks

function LiveTelemetry() {
  // Use custom hooks for modular functionality (order matters for dependencies)
  const [wsConnected, setWsConnected] = React.useState(false);
  const [configuratorOpen, setConfiguratorOpen] = React.useState(false);

  const chartSeries = useChartSeries(wsConnected);

  const { telemetryData, handleTelemetryMessage, getSensorValue } =
    useTelemetryHandlers(chartSeries.updateSample);

  const {
    connected,
    senderConnected,
    database_enabled,
    connect,
    disconnect,
    togglePersist,
  } = useWebSocketTelemetry(handleTelemetryMessage);

  // Sync WebSocket connection state with chart series
  React.useEffect(() => {
    setWsConnected(connected);
  }, [connected]);

  const {
    layout,
    addWidget,
    removeWidget,
    resetToDefault,
    applyProfile,
    isCustomized,
  } = useWidgetPreferences(DEFAULT_LAYOUT);

  return (
    <div className="telemetry-dashboard">
      {/* Header */}
      <header className="telemetry-header">
        <div className="header-left">
          <div className="session-info">
            <span className="session-label">LIVE SESSION</span>
            <div
              className={`session-status ${connected ? "connected" : "disconnected"}`}
            >
              <span className="status-indicator"></span>
              {connected ? "CONNECTED" : "DISCONNECTED"}
            </div>
            <div className="sender-status">
              <span
                className={`sender-status-square ${senderConnected ? "connected" : "disconnected"}`}
              ></span>
              <span className="sender-status-label">SENDER</span>
            </div>
          </div>
        </div>

        <div className="control-panel">
          {!connected ? (
            <button className="control-btn connect-btn" onClick={connect}>
              <span>{"\u25B6"}</span>
              <span>CONNECT</span>
            </button>
          ) : (
            <button className="control-btn disconnect-btn" onClick={disconnect}>
              <span>{"\u23F8"}</span>
              <span>DISCONNECT</span>
            </button>
          )}
          <button
            className="control-btn"
            onClick={togglePersist}
            style={{ background: database_enabled ? "#10b981" : "#64748b" }}
          >
            <span>{database_enabled ? "💾" : "⏸"}</span>
            <span>DB {database_enabled ? "ON" : "OFF"}</span>
          </button>
          <button
            className="control-btn"
            onClick={() => setConfiguratorOpen(true)}
            style={{ background: isCustomized ? "#3b82f6" : "#64748b" }}
          >
            <span>⚙️</span>
            <span>CUSTOMIZE</span>
          </button>
        </div>
      </header>

      {/* Main Dashboard Grid - Now using modular layout */}
      <TelemetryLayout
        layout={layout}
        getSensorValue={getSensorValue}
        telemetryData={telemetryData}
        series={chartSeries.series}
        chartRefs={chartSeries.chartRefs}
      />

      {/* Widget Configurator Modal */}
      <WidgetConfigurator
        isOpen={configuratorOpen}
        onClose={() => setConfiguratorOpen(false)}
        layout={layout}
        addWidget={addWidget}
        removeWidget={removeWidget}
        resetToDefault={resetToDefault}
        applyProfile={applyProfile}
        isCustomized={isCustomized}
      />
    </div>
  );
}

export default LiveTelemetry;
