import React from "react";
import { StatWidget } from "./widgets/StatWidget";
import { ChartWidget } from "./widgets/ChartWidget";
import { FeedWidget } from "./widgets/FeedWidget";
import { WIDGET_TYPES } from "../config/widgetConfig";

/**
 * TelemetryLayout - Manages the 3-panel grid layout
 * @param {Object} props
 * @param {Object} props.layout - Layout configuration
 * @param {Function} props.getSensorValue - Function to get sensor values
 * @param {Object} props.telemetryData - Latest telemetry data
 * @param {Object} props.series - Chart series data refs
 * @param {Object} props.chartRefs - Chart instance refs
 */
export function TelemetryLayout({
  layout,
  getSensorValue,
  telemetryData,
  series,
  chartRefs,
}) {
  const renderWidget = (widget) => {
    switch (widget.type) {
      case WIDGET_TYPES.STAT:
        return (
          <StatWidget
            key={widget.id}
            sensorId={widget.sensorId}
            size={widget.size}
            getSensorValue={getSensorValue}
          />
        );

      case WIDGET_TYPES.CHART:
        // Map chart ID to the appropriate chart ref
        let chartRef;
        if (widget.id === "chart-rpm") {
          chartRef = chartRefs.rpm;
        } else if (widget.id === "chart-throttle-brake") {
          chartRef = chartRefs.throttleBrake;
        } else if (widget.id === "chart-battery") {
          chartRef = chartRefs.battery;
        }

        return (
          <ChartWidget
            key={widget.id}
            sensorIds={widget.sensorIds}
            title={widget.title}
            series={series}
            chartRef={chartRef}
          />
        );

      case WIDGET_TYPES.FEED:
        return (
          <FeedWidget key={widget.id} telemetryData={telemetryData} />
        );

      default:
        return null;
    }
  };

  const renderSecondaryStats = (widgets) => {
    // Group medium-sized stats in pairs
    const grouped = [];
    for (let i = 0; i < widgets.length; i += 2) {
      if (widgets[i].size === "medium" && widgets[i + 1]?.size === "medium") {
        grouped.push(
          <div key={`group-${i}`} className="secondary-stats">
            {renderWidget(widgets[i])}
            {renderWidget(widgets[i + 1])}
          </div>
        );
      } else {
        grouped.push(renderWidget(widgets[i]));
        if (widgets[i + 1]) {
          grouped.push(renderWidget(widgets[i + 1]));
        }
      }
    }
    return grouped;
  };

  // Separate left panel widgets by size
  const leftPanelLarge = layout.leftPanel.filter((w) => w.size === "large");
  const leftPanelMedium = layout.leftPanel.filter((w) => w.size === "medium");

  return (
    <div className="telemetry-grid">
      {/* Left Panel - Primary Stats */}
      <div className="left-panel">
        {leftPanelLarge.map((widget) => renderWidget(widget))}
        {renderSecondaryStats(leftPanelMedium)}
      </div>

      {/* Center Panel - Charts */}
      <div className="center-panel">
        {layout.centerPanel.map((widget) => renderWidget(widget))}
      </div>

      {/* Right Panel - Additional Stats + Feed */}
      <div className="right-panel">
        {layout.rightPanel.map((widget) => renderWidget(widget))}
      </div>
    </div>
  );
}
