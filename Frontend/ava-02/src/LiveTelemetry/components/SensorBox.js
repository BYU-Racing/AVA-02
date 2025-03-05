// components/SensorGraph.js
import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register the required components (scales, elements, etc.)
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const SensorGraph = ({ title, sensorName, data, handleRemoveSensor }) => {
  
  const [chartData, setChartData] = useState({
    labels: Array(data.length).fill("0"), // Default labels if no data
    datasets: [
      {
        label: sensorName,
        data: Array(data.length).fill(0), // Default data set to 0
        borderColor: "blue",
        borderWidth: 2,
        fill: false,
      },
    ],
  });

  useEffect(() => {
    // Update the chart data whenever new data comes in
    if (data.length > 0) {
      setChartData({
        labels: data.map((_, index) => index),
        datasets: [
          {
            label: sensorName,
            data: data,
            borderColor: "blue",
            borderWidth: 2,
            fill: false,
          },
        ],
      });
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
        <div style={{ width: "100%", height: "100%" }}>
          <h3>{title}</h3>
          <Line data={chartData} />
        </div>
      </div>
    </>
  );
};

export default SensorGraph;
