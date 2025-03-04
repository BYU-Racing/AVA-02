// components/SensorGraph.js
import React from "react";
import { Line } from "react-chartjs-2";

const SensorGraph = ({ sensorName, data }) => {
  const chartData = {
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
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <h3>{sensorName}</h3>
      <Line data={chartData} />
    </div>
  );
};

export default SensorGraph;
