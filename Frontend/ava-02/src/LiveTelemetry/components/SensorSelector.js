import React from "react";

// List of available sensors
const sensors = [
  "throttle1",
  "throttle2",
  "brake",
  "torque",
  "batteryP",
  "batteryTemp",
  "tractive",
];

const SensorSidebar = ({ selectedSensors = [], setSelectedSensors }) => {
  // Function to toggle sensor selection
  const toggleSensor = (sensor) => {
    setSelectedSensors(
      (prev) =>
        prev.includes(sensor)
          ? prev.filter((s) => s !== sensor) // Remove sensor if it's already selected
          : [...prev, sensor] // Add sensor if it's not selected
    );
  };

  return (
    <div className="sidebar">
      <h2>Select Sensors</h2>
      {/* Iterate over the sensors list and render checkboxes */}
      {sensors.map((sensor) => (
        <div key={sensor}>
          <input
            type="checkbox"
            checked={selectedSensors.includes(sensor)} // Check if the sensor is selected
            onChange={() => toggleSensor(sensor)} // Toggle selection on change
          />
          {sensor}
        </div>
      ))}
    </div>
  );
};

export default SensorSidebar;
