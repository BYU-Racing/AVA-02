import React, { useEffect, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register the necessary components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend
);

const SensorGraph = ({ title, sensorName, data, handleRemoveSensor }) => {
  // List of sensor names that should render as bar charts
  const barChartSensors = ["brakePressure", "throttle1", "throttle2"];

  // Generate chart data for time series (line chart)
  const generateTimeSeriesData = () => {
    return {
      labels: data.map((_, index) => index), // The X-axis is the index of each point
      datasets: data.map((dataset, index) => ({
        label: `${sensorName} - Dataset ${index + 1}`,
        data: dataset,
        borderColor: `hsl(${index * 60}, 100%, 50%)`, // Dynamic color for each line
        borderWidth: 2,
        fill: false, // Do not fill the area under the line
      })),
    };
  };

  // Generate chart data for a single bar chart
  const generateBarChartData = () => ({
    labels: [sensorName],
    datasets: [
      {
        label: sensorName,
        data: [data[data.length - 1]], // Only the most recent value
        backgroundColor: "#1876D1",
        borderColor: "#1876D1",
        borderWidth: 1,
      },
    ],
  });

  useEffect(() => {
    if (data.length > 0) {
      const chartData = barChartSensors.includes(sensorName)
        ? generateBarChartData() // Use the most recent data point for bar chart
        : generateTimeSeriesData(); // Use all data for time series chart

      if (window.myChart) {
        window.myChart.data = chartData;
        window.myChart.update();
      }
    }
  }, [data, sensorName]);

  useEffect(() => {
    // Cleanup the chart on unmount to prevent "Canvas already in use" error
    return () => {
      if (window.myChart) {
        window.myChart.destroy();
      }
    };
  }, []);

  return (
    <>
      <div
        className="sensor-box"
        draggable
        onDragStart={(e) => e.dataTransfer.setData("text", sensorName)}
      >
        <button
          className="close-btn"
          onClick={() => handleRemoveSensor(sensorName)}
        >
          X
        </button>
        <p>Latest Value: {data[data.length - 1]}</p>
        <div
          style={{
            display: "flex",
            flexDirection: "row", // Arrange the bar charts side by side
            justifyContent: "space-between", // Distribute them evenly
            alignItems: "flex-end", // Align the bars to the bottom
            width: "100%",
            height: "100%",
          }}
        >
          <h3>{title}</h3>
          {barChartSensors.includes(sensorName) ? (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between", // Space the bars evenly
                flexDirection: "row",
                flexGrow: 1,
                width: "100%", // Allow the bars to stretch across the container
                height: "100%",
              }}
            >
              <Bar
                data={generateBarChartData()} // Only show the most recent value as a bar
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: "x", // Bar chart will display horizontally
                  plugins: {
                    legend: {
                      display: false, // Disable the legend for now
                    },
                  },
                }}
              />
            </div>
          ) : (
            <Line
              data={generateTimeSeriesData()} // Show time series data with all data points
              options={{
                responsive: true,
                maintainAspectRatio: false,
              }}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default SensorGraph;
