import React, { useState, useCallback } from "react";
import { connectSerial } from "../Handlers/Communication.js";
import { useSensors } from "./context/SensorContext.tsx";

const SerialConnection = () => {
  const [isReading, setIsReading] = useState(false);
  const [message, setMessage] = useState("");
  const [connectionError, setConnectionError] = useState("");

  // Get context functions
  const { updateSensor, getSensorById } = useSensors();

  // Define sensor data handler as a callback
  const handleSensorData = useCallback(
    (sensorData) => {
      // Only process if we have valid data
      if (!sensorData) return;

      const { sensorId, value } = sensorData;

      // Get the sensor from context
      const sensor = getSensorById(sensorId);
      if (!sensor) {
        console.warn(`Sensor not found for ID: ${sensorId}`);
        return;
      }

      // Handle boolean values for specific sensors
      let processedValue = value;
      if (sensor.name === "startSwitch") {
        processedValue = value > 0; // Convert to boolean
      }

      // Create updated sensor object
      const updatedSensor = { ...sensor };

      // Update the data based on its current format
      if (Array.isArray(updatedSensor.data)) {
        // For sensors that store history (arrays)
        updatedSensor.data = [
          processedValue,
          ...updatedSensor.data.slice(0, -1),
        ];
      } else {
        // For sensors with single values
        updatedSensor.data = processedValue;
      }

      // Update the sensor in context
      updateSensor(updatedSensor);
    },
    [getSensorById, updateSensor]
  );

  const handleConnect = async () => {
    setConnectionError("");

    try {
      // Connect and pass our sensor data handler
      await connectSerial(
        setIsReading,
        setMessage,
        setConnectionError,
        handleSensorData
      );
    } catch (err) {
      setConnectionError(
        err.message || "Unknown error connecting to serial port"
      );
    }
  };

  return (
    <div className="serial-connection">
      <h3>Serial Connection</h3>
      <button
        onClick={handleConnect}
        disabled={isReading}
        className={isReading ? "connected" : ""}
      >
        {isReading ? "Connected" : "Connect to Serial"}
      </button>

      {connectionError && (
        <p className="error-message">Error: {connectionError}</p>
      )}

      {isReading && (
        <div className="connection-status">
          <p>Status: Connected</p>
          <p>Last message: {message}</p>
        </div>
      )}
    </div>
  );
};

export default SerialConnection;
