import { useState, useEffect, React } from "react";
import "../App.css";
import "./LiveTelemetry.css";
import Button from "@mui/material/Button";
import RssFeedIcon from "@mui/icons-material/RssFeed";
import SensorSidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import SpeedDisplay from "./components/SpeedDisplay";
import { connectSerial } from "./Handlers/Communication";
import { useSensors } from "./components/context/SensorContext.tsx";


function LiveTelemetry() {
  // const [port, setPort] = useState(null); // To store the selected port
  const [isReading, setIsReading] = useState(false); // Track if reading is in progress
  const [connectionError, setConnectionError] = useState(null); // Track any connection errors
  const [loraMessage, setMessage] = useState(null); // Message received from LoRA
  const {
    Sensors,
    availableSensors,
    setSensors,
    updateSensor,
    getSensorByName,
    getSensorById,
    selectedSensors,
    setSelectedSensors,
    handleRemoveSensor,
  } = useSensors();

  const handleConnectClick = () => {
    // Call the connectSerial function when the button is clicked
    connectSerial(
      setIsReading,
      setMessage,
      setConnectionError, // Pass the setConnectionError function
    );
  };

  // Updated useEffect to update each sensor individually
  useEffect(() => {
    if (!isReading) {
      const interval = setInterval(() => {
        // Generate random data for each sensor

        // Throttle1 Sensor (ID: 2)
        const throttle1 = getSensorByName("throttle1");
        if (throttle1) {
          const newData = [
            parseFloat((Math.random() * 100).toFixed(1)),
            ...(Array.isArray(throttle1.data)
              ? throttle1.data.slice(0, 4)
              : [0, 0, 0, 0]),
          ];
          updateSensor({ ...throttle1, data: newData });
        }

        // Throttle2 Sensor (ID: 3)
        const throttle2 = getSensorByName("throttle2");
        if (throttle2) {
          const newData = [
            parseFloat((Math.random() * 100).toFixed(1)),
            ...(Array.isArray(throttle2.data)
              ? throttle2.data.slice(0, 4)
              : [0, 0, 0, 0]),
          ];
          updateSensor({ ...throttle2, data: newData });
        }

        // Brake Pressure Sensor (ID: 4)
        const brakePressure = getSensorByName("brakePressure");
        if (brakePressure) {
          const newData = [
            parseFloat((Math.random() * 100).toFixed(1)),
            ...(Array.isArray(brakePressure.data)
              ? brakePressure.data.slice(0, 4)
              : [0, 0, 0, 0]),
          ];
          updateSensor({ ...brakePressure, data: newData });
        }

        // Torque Sensor (ID: 37)
        const torque = getSensorByName("torque");
        if (torque) {
          const newData = [
            parseFloat((Math.random() * 100).toFixed(1)),
            ...(Array.isArray(torque.data)
              ? torque.data.slice(0, 4)
              : [0, 0, 0, 0]),
          ];
          updateSensor({ ...torque, data: newData });
        }

        // Speed Sensor (ID: 38)
        const speed = getSensorByName("speed");
        if (speed) {
          // For speed, just update with a single value since it's not an array
          updateSensor({
            ...speed,
            data: parseFloat((Math.random() * 100).toFixed(1)),
          });
        }

        // Coolant Temperature Sensor (ID: 20)
        const coolantTemp = getSensorByName("mc_coolantTemp");
        if (coolantTemp) {
          const newData = [
            parseFloat((Math.random() * 200).toFixed(1)),
            ...(Array.isArray(coolantTemp.data)
              ? coolantTemp.data.slice(0, 4)
              : [0, 0, 0, 0]),
          ];
          updateSensor({ ...coolantTemp, data: newData });
        }

        // Battery Percentage Sensor (ID: 26)
        const batteryPerc = getSensorByName("bsm_batteryPerc");
        if (batteryPerc) {
          const newData = [
            parseFloat((Math.random() * 100).toFixed(1)),
            ...(Array.isArray(batteryPerc.data)
              ? batteryPerc.data.slice(0, 4)
              : [0, 0, 0, 0]),
          ];
          updateSensor({ ...batteryPerc, data: newData });
        }

        // Battery Temperature Sensor (ID: 27)
        const batteryTemp = getSensorByName("bsm_batteryTemp");
        if (batteryTemp) {
          const newData = [
            parseFloat((Math.random() * 100).toFixed(1)),
            ...(Array.isArray(batteryTemp.data)
              ? batteryTemp.data.slice(0, 4)
              : [0, 0, 0, 0]),
          ];
          updateSensor({ ...batteryTemp, data: newData });
        }

        // Tractive Sensor (ID: 35)
        const tractive = getSensorByName("tractive");
        if (tractive) {
          // For tractive, toggle between true and false
          updateSensor({ ...tractive, data: Math.random() > 0.5 });
        }

        // Current Sensor (ID: 28)
        const current = getSensorByName("bsm_current");
        if (current) {
          const newData = [
            parseFloat((Math.random() * 15).toFixed(1)),
            ...(Array.isArray(current.data)
              ? current.data.slice(0, 4)
              : [0, 0, 0, 0]),
          ];
          updateSensor({ ...current, data: newData });
        }

        // Range Sensor (ID: 36)
        const range = getSensorByName("range");
        if (range) {
          const newData = [
            parseFloat((Math.random() * 30).toFixed(1)),
            ...(Array.isArray(range.data)
              ? range.data.slice(0, 4)
              : [0, 0, 0, 0]),
          ];
          updateSensor({ ...range, data: newData });
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isReading, updateSensor, getSensorByName]);

  useEffect(() => {
    // When loraMessage changes, update the sensor data
    if (loraMessage) {
      const sensorId = loraMessage.sensorId;
      const sensorValue = loraMessage.value;

      // Find the sensor to update
      const sensorToUpdate = getSensorById(sensorId);

      if (sensorToUpdate) {
        // Create a copy of the sensor
        const updatedSensor = { ...sensorToUpdate };

        // Handle different data types appropriately
        if (typeof sensorToUpdate.data === "boolean") {
          // For boolean sensors (like startSwitch, tractive)
          // Convert the value to boolean (any non-zero value is true)
          updatedSensor.data = Boolean(sensorValue);
        } else if (Array.isArray(sensorToUpdate.data)) {
          // For array sensors that store history
          // Add new value to beginning and remove last value to maintain array length
          updatedSensor.data = [
            sensorValue,
            ...sensorToUpdate.data.slice(0, sensorToUpdate.data.length - 1),
          ];
        } else {
          // For simple numeric sensors (like speed)
          updatedSensor.data = sensorValue;
        }

        console.log(`Updating sensor ${updatedSensor.name} (ID: ${sensorId}) 
                  from ${JSON.stringify(sensorToUpdate.data)} 
                  to ${JSON.stringify(updatedSensor.data)}`);

        // Update the sensor with our changes
        updateSensor(updatedSensor);
      } else {
        console.warn(`Cannot update: sensor with ID ${sensorId} not found`);
      }
    }
  }, [getSensorById, loraMessage, updateSensor]);


  return (
    <>
      <div className="liveTelemetryBody">
        <div className="header">
          {connectionError && (
            <p style={{ color: "red", zIndex: 1000, backgroundColor: "white" }}>
              Error: {connectionError}
            </p>
          )}
          <Button
            variant="contained"
            startIcon={<RssFeedIcon />}
            onClick={handleConnectClick}
            disabled={isReading}
            className="connectBtn"
          >
            Connect
          </Button>
        </div>
        <SpeedDisplay />
        <h1 style={{ color: "white" }}>{loraMessage}</h1>
        <div className="sensorBody">
          <SensorSidebar
            selectedSensors={selectedSensors}
            setSelectedSensors={setSelectedSensors}
            sensorData={Sensors}
            availableSensors={availableSensors}
            handleRemoveSensor={handleRemoveSensor}
          />
          <Dashboard
            sensorData={Sensors}
            setSelectedSensors={setSelectedSensors}
            selectedSensors={selectedSensors}
            handleRemoveSensor={handleRemoveSensor}
          />
        </div>
      </div>
    </>
  );
}

export default LiveTelemetry;
