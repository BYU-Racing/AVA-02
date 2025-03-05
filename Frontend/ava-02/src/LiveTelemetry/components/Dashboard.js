import {React, useState, useEffect} from "react";
import GridLayout from "react-grid-layout";
import SensorGraph from "./SensorBox";

import "react-grid-layout/css/styles.css";
import './componentCSS/Dashboard.css'

const Dashboard = ({ 
    sensorData = {}, 
    sensorValues,
    selectedSensors, 
    setSelectedSensors, 
    handleRemoveSensor
  }) => {
    // Ensure selectedSensors is always an array and sensorData is an object
    const [displayedSensors, setDisplayedSensors] = useState([]);

    const handleDrop = (sensorName) => {
      if (!displayedSensors.includes(sensorName)) {
        setDisplayedSensors([...displayedSensors, sensorName]);
      }
      // Remove the sensor from the Sidebar (update selectedSensors in LiveTelemetry)
      setSelectedSensors((prev) =>
        prev.filter((sensor) => sensor !== sensorName)
      );
    };

    const handleRemoveFromDashboard = (sensorName) => {
      // Remove the sensor from displayedSensors (dashboard)
      setDisplayedSensors((prevDisplayed) =>
        prevDisplayed.filter((sensor) => sensor !== sensorName)
      );
      // Remove the sensor from the Sidebar (selectedSensors)
      handleRemoveSensor(sensorName);
    };


    // // Create the layout based on selectedSensors
    // const layout = selectedSensors.map((sensor, index) => ({
    //   i: sensor,
    //   x: (index % 3) * 2,
    //   y: Math.floor(index / 3) * 2,
    //   w: 2,
    //   h: 2,
    // }));

    return (
      <div className="layout">
        <div
          className="dashboard"
          onDrop={(e) => handleDrop(e.dataTransfer.getData("text"))}
          onDragOver={(e) => e.preventDefault()}
        >
          <h1>Dashboard</h1>
          <GridLayout cols={6} rowHeight={100} width={1200}>
            {displayedSensors.map((sensor) => (
              <SensorGraph
                key={sensor}
                sensorName={sensor}
                data={sensorData[sensor]}
                handleRemoveSensor={handleRemoveFromDashboard} // Pass removeSensor function to SensorBox
              />
            ))}
          </GridLayout>
        </div>
      </div>
    );
  };

export default Dashboard;
