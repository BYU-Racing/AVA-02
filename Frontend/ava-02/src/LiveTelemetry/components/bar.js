import React, { useState, useEffect } from "react";
import './componentCSS/bar.css';
import { Bar } from "react-chartjs-2";

const BarGraph = ({ value, maxValue }) => {
  const numSegments = 10; // Number of bars
  const segmentHeight = (value / maxValue) * 100; // Convert value to percentage

  return (
    <div className="barGraphContainer">
      {Array.from({ length: numSegments }).map((_, index) => (
        <div
          key={index}
          className="barSegment"
          style={{
            height: index < segmentHeight / (100 / numSegments) ? "10%" : "0%",
          }}
        />
      ))}
    </div>
  );
};

export default BarGraph