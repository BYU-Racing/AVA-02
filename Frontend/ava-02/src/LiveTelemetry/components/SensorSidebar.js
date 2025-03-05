import React from "react";
import SensorGraph from "./SensorBox";
import "./componentCSS/SensorSidebar.css";


const SensorSidebar = ({ 
    selectedSensors,
    setSelectedSensors,
    sensorData, 
    availableSensors, 
    handleRemoveSensor}) => {
  
  // Function to handle sensor selection
  const handleSensorChange = (event) => {
    const selectedSensor = event.target.value;

    // Update selected sensors and remove the selected sensor from the dropdown list
    setSelectedSensors((prevSelected) => {
      const updatedSelected = [...prevSelected, selectedSensor];
      return updatedSelected;
    });
  };


  return (
    <div className="sidebar">
      <h2>Select Sensor</h2>
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

      {/* Render selected sensors with a close button */}
      <div className="sensor-boxes">
        {selectedSensors.map((sensor) => (
          <div key={sensor} className="sensor-box">
            <SensorGraph
              title={`Graph for ${sensor}`}
              sensorName={sensor}
              data={sensorData[sensor]}
              handleRemoveSensor={handleRemoveSensor} // Pass removeSensor function to SensorBox
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SensorSidebar;
