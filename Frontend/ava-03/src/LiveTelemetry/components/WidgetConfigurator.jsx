import React, { useState } from "react";
import { SENSOR_CONFIGS } from "../config/sensorConfig";
import { WIDGET_TYPES, PANELS } from "../config/widgetConfig";
import { getAvailableProfiles } from "../config/profiles";
import "./WidgetConfigurator.css";

/**
 * WidgetConfigurator - UI for customizing dashboard layout
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the configurator is open
 * @param {Function} props.onClose - Close handler
 * @param {Object} props.layout - Current layout configuration
 * @param {Function} props.addWidget - Add widget function
 * @param {Function} props.removeWidget - Remove widget function
 * @param {Function} props.resetToDefault - Reset to default layout
 * @param {Function} props.applyProfile - Apply profile layout
 * @param {boolean} props.isCustomized - Whether layout is customized
 */
export function WidgetConfigurator({
  isOpen,
  onClose,
  layout,
  addWidget,
  removeWidget,
  resetToDefault,
  applyProfile,
  isCustomized,
}) {
  const [selectedPanel, setSelectedPanel] = useState(PANELS.LEFT);
  const availableProfiles = getAvailableProfiles();

  if (!isOpen) return null;

  // Get currently displayed sensor IDs
  const displayedSensorIds = new Set();
  Object.values(layout).forEach((panelWidgets) => {
    panelWidgets.forEach((widget) => {
      if (widget.sensorId !== undefined) {
        displayedSensorIds.add(widget.sensorId);
      }
    });
  });

  // Get available sensors (not currently displayed)
  const availableSensors = Object.values(SENSOR_CONFIGS).filter(
    (config) => !displayedSensorIds.has(config.id)
  );

  const handleAddSensor = (sensorId) => {
    const config = SENSOR_CONFIGS[sensorId];
    if (!config) return;

    const newWidget = {
      id: `stat-${sensorId}-${Date.now()}`,
      type: WIDGET_TYPES.STAT,
      sensorId: sensorId,
      size: config.size || "medium",
    };

    addWidget(selectedPanel, newWidget);
  };

  const handleRemoveWidget = (widgetId) => {
    removeWidget(widgetId);
  };

  const handleReset = () => {
    if (window.confirm("Reset to default layout? This will remove all customizations.")) {
      resetToDefault();
      onClose();
    }
  };

  const handleApplyProfile = (profileKey) => {
    const profile = availableProfiles.find((p) => p.key === profileKey);
    if (profile && profile.layout) {
      applyProfile(profile.layout);
    }
  };

  const getCurrentPanelWidgets = () => {
    return layout[selectedPanel] || [];
  };

  return (
    <div className="configurator-overlay" onClick={onClose}>
      <div className="configurator-modal" onClick={(e) => e.stopPropagation()}>
        <div className="configurator-header">
          <h2>Customize Dashboard</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="configurator-content">
          {/* Team Profiles */}
          <div className="profiles-section">
            <h3>Team Profiles</h3>
            <p className="profiles-description">
              Quick layouts optimized for different team roles
            </p>
            <div className="profiles-grid">
              {availableProfiles.map((profile) => (
                <button
                  key={profile.key}
                  className="profile-card"
                  onClick={() => handleApplyProfile(profile.key)}
                >
                  <div className="profile-name">{profile.name}</div>
                  <div className="profile-description">{profile.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Panel Selector */}
          <div className="panel-selector">
            <label>Add widgets to:</label>
            <div className="panel-tabs">
              <button
                className={`panel-tab ${selectedPanel === PANELS.LEFT ? "active" : ""}`}
                onClick={() => setSelectedPanel(PANELS.LEFT)}
              >
                Left Panel
              </button>
              <button
                className={`panel-tab ${selectedPanel === PANELS.CENTER ? "active" : ""}`}
                onClick={() => setSelectedPanel(PANELS.CENTER)}
              >
                Center Panel
              </button>
              <button
                className={`panel-tab ${selectedPanel === PANELS.RIGHT ? "active" : ""}`}
                onClick={() => setSelectedPanel(PANELS.RIGHT)}
              >
                Right Panel
              </button>
            </div>
          </div>

          {/* Current Widgets in Selected Panel */}
          <div className="current-widgets-section">
            <h3>Current Widgets ({getCurrentPanelWidgets().length})</h3>
            <div className="current-widgets-list">
              {getCurrentPanelWidgets().length === 0 ? (
                <div className="empty-message">No widgets in this panel</div>
              ) : (
                getCurrentPanelWidgets().map((widget) => {
                  const config = SENSOR_CONFIGS[widget.sensorId];
                  const widgetName = widget.title || config?.displayName || widget.type.toUpperCase();
                  return (
                    <div key={widget.id} className="current-widget-item">
                      <div className="widget-info">
                        <span className="widget-name">
                          {widgetName}
                        </span>
                        <span className="widget-meta">
                          {widget.size || widget.type} · {widget.type}
                        </span>
                      </div>
                      {widget.type !== WIDGET_TYPES.FEED && (
                        <button
                          className="remove-btn"
                          onClick={() => handleRemoveWidget(widget.id)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Available Sensors */}
          <div className="available-sensors-section">
            <h3>Available Sensors ({availableSensors.length})</h3>
            <div className="available-sensors-list">
              {availableSensors.length === 0 ? (
                <div className="empty-message">All sensors are displayed</div>
              ) : (
                availableSensors.map((config) => (
                  <div key={config.id} className="sensor-item">
                    <div className="sensor-info">
                      <span className="sensor-name">{config.displayName}</span>
                      <span className="sensor-meta">
                        ID {config.id} · {config.unit || "no unit"}
                      </span>
                    </div>
                    <button
                      className="add-btn"
                      onClick={() => handleAddSensor(config.id)}
                    >
                      + Add
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="configurator-footer">
          {isCustomized && (
            <button className="reset-btn" onClick={handleReset}>
              Reset to Default
            </button>
          )}
          <button className="done-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
