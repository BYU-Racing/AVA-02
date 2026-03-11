import React, { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { getSensorConfig } from "../../config/sensorConfig";

const ANIMATION_TIME = 100;

/**
 * ChartWidget - Displays a line chart for one or more sensors
 * @param {Object} props
 * @param {number[]} props.sensorIds - Array of sensor IDs to chart
 * @param {string} props.title - Chart title
 * @param {Object} props.series - Series data refs
 * @param {React.Ref} props.chartRef - Chart instance ref
 */
export function ChartWidget({ sensorIds, title, series, chartRef }) {
  // Chart options
  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: ANIMATION_TIME,
        easing: "linear",
      },
      animations: {
        x: { duration: 0 },
        y: { duration: ANIMATION_TIME, easing: "linear" },
      },
      plugins: {
        legend: { display: sensorIds.length > 1 },
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
    }),
    [sensorIds.length]
  );

  // Build datasets from sensor IDs
  const chartData = useMemo(() => {
    const datasets = sensorIds.map((sensorId) => {
      const config = getSensorConfig(sensorId);
      if (!config || !config.chartKey) return null;

      return {
        label: config.displayName,
        data: series[config.chartKey]?.current || [],
        borderColor: config.color || "#00d9ff",
        borderWidth: 2,
        tension: 0,
        pointRadius: 0,
      };
    }).filter(Boolean);

    return {
      labels: series.labels?.current || [],
      datasets,
    };
  }, [sensorIds, series]);

  return (
    <div className="chart-section">
      <div className="section-header">{title}</div>
      <div className="chart-wrapper">
        <Line ref={chartRef} data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}
