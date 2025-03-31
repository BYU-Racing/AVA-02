import React from "react";
import SensorGraph from "./SensorGraph.js";
import "./componentCSS/SensorSidebar.css";
import { useSensors } from "./context/SensorContext.tsx";

const SensorSidebar = () => {
  const {
    selectedSensors,
    setSelectedSensors,
    handleRemoveSelectedSensor,
    availableSensors,
  } = useSensors();

  // Function to handle sensor selection
  const handleSensorChange = (event) => {
    const sensorId = Number(event.target.value); // Convert to number
    if (isNaN(sensorId)) return;
    if (!sensorId) {
      console.warn(`Sensor with ID ${sensorId} not found`);
      return;
    }
    // Check if the sensor is already selected
    if (selectedSensors.some((s) => s.id === sensorId)) {
      return; // Skip if already selected
    }
    // Update selected sensors array with the new sensor object
    setSelectedSensors((prevSelected) => [...prevSelected, sensorId]);
  };

    

  return (
    <div className="sidebar">
      <h2>Select Sensor</h2>
      <select onChange={handleSensorChange} defaultValue="">
        <option value="" disabled>
          {availableSensors.length > 0
            ? "--Select a sensor--"
            : "-- No sensors available --"}
        </option>
        {availableSensors.map((sensor) => (
          <option key={sensor.id} value={sensor.id}>
            {sensor.name}
          </option>
        ))}
      </select>

      {/* Render selected sensors with a close button */}
      <div className="sensor-boxes">
        {selectedSensors.map((sensorId) => {
          // Find the sensor by ID

          // If sensor doesn't exist, display an error
          if (!sensorId) {
            return (
              <div key={sensorId} className="sensor-box">
                <p>Sensor ID {sensorId} not found</p>
                <button
                  onClick={() => handleRemoveSelectedSensor(sensorId)}
                  className="remove-button"
                >
                  ×
                </button>
              </div>
            );
          }

          // Render the sensor with data
          return (
            <div key={sensorId} className="sensor-box">
              <SensorGraph sensorId={sensorId} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SensorSidebar;
