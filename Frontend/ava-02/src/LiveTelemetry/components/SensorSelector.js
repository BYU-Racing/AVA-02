// components/SensorSidebar.js
import React, { useState } from "react";
import SensorGraph from "./SensorBox"; // Import SensorGraph component
import "./componentCSS/SensorSelector.css";

// List of available sensors
const initialSensors = [
  "throttle1",
  "throttle2",
  "brake",
  "torque",
  "batteryP",
  "batteryTemp",
  "tractive",
];

const SensorSidebar = ({ sensorData }) => {
  // State to hold the selected sensors
  const [selectedSensors, setSelectedSensors] = useState([]);
  // State for the remaining sensors in the dropdown
  const [availableSensors, setAvailableSensors] = useState(initialSensors);

  // Function to handle sensor selection
  const handleSensorChange = (event) => {
    const selectedSensor = event.target.value;

    // Update selected sensors and remove the selected sensor from the dropdown list
    setSelectedSensors((prevSelected) => {
      const updatedSelected = [...prevSelected, selectedSensor];
      setAvailableSensors(
        availableSensors.filter((sensor) => sensor !== selectedSensor)
      );
      return updatedSelected;
    });
  };

  return (
    <div className="sidebar">
      <h2>Select Sensor</h2>
      {/* Dropdown for sensor selection */}
      <select onChange={handleSensorChange} defaultValue="">
        <option value="" disabled>
          Select a sensor
        </option>
        {availableSensors.map((sensor) => (
          <option key={sensor} value={sensor}>
            {sensor}
          </option>
        ))}
      </select>

      {/* Render a SensorGraph for each selected sensor */}
      <div className="sensor-boxes">
        {selectedSensors.map((sensor, index) => (
          <div key={index} className="sensor-box">
            <h3>{sensor}</h3>
            {/* Pass title as the sensor name and data from the parent */}
            <SensorGraph
              title={`Graph for ${sensor}`}
              sensorName={sensor}
              data={sensorData[sensor]} // Pass data for the sensor
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SensorSidebar;
