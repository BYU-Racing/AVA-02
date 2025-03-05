import React, { useState, useEffect } from "react";
import './componentCSS/StackedBar.css'



const StackedBar = ({ maxValue, numSegments = 10 }) => {

  const [value, setValue] = useState(0);
  const activeSegments = Math.round((value / maxValue) * numSegments);


  useEffect(() => {
    const interval = setInterval(() => {
      setValue(Math.floor(Math.random() * 100)); // Random value 0-100
    }, 500);
    return () => clearInterval(interval);
  }, []);

    
return (
  <div className="stackedBarGraphContainer">
    {[...Array(numSegments)].map((_, index) => (
      <div
        key={index}
        className={`stackedBarSegment ${index < activeSegments ? "active" : ""}`}
      />
    ))}
  </div>
);
};

export default StackedBar;