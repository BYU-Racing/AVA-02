import { useState, useEffect, React } from "react";
// import Typography from "@mui/material/Typography";
import "../App.css";
import "./LiveTelemetry.css";
import Button from "@mui/material/Button";
import RssFeedIcon from "@mui/icons-material/RssFeed";
import SensorSidebar from "./components/SensorSidebar";
import Dashboard from "./components/Dashboard";
import SpeedDisplay from "./components/SpeedDisplay";
import {connectSerial} from "./Handlers/Communication";

function LiveTelemetry() {
  // const [port, setPort] = useState(null); // To store the selected port
  const [isReading, setIsReading] = useState(false); // Track if reading is in progress
  const [connectionError, setConnectionError] = useState(null); // Track any connection errors
  const [loraMessage, setMessage] = useState(null); // Message received from LoRA
  const [selectedSensors, setSelectedSensors] = useState([]);
  const [sensorValues, setSensorValues] = useState({
    throttle1: 0,
    throttle2: 0,
    speed: 0,
    torque: 0,
    coolantTemp: 0,
    brakePressure: 0,
    batteryPerc: 0,
    batteryTemp: 0,
    tractive: false,
    currentDraw: 0,
    range: 0,
  });

  const [sensorData, setSensorData] = useState({
    throttle1: [0, 0, 0, 0, 0],
    throttle2: [0, 0, 0, 0, 0],
    speed: [0, 0, 0, 0, 0],
    torque: [0, 0, 0, 0, 0],
    coolantTemp: [0, 0, 0, 0, 0],
    brakePressure: [0, 0, 0, 0, 0],
    batteryPerc: [0, 0, 0, 0, 0],
    batteryTemp: [0, 0, 0, 0, 0],
    tractive: [0, 0, 0, 0, 0],
    currentDraw: [0, 0, 0, 0, 0],
  });

  // Dynamically get available sensors from sensorValues
  const availableSensors = Object.keys(sensorValues);

  const handleConnectClick = () => {
    // Call the connectSerial function when the button is clicked
    connectSerial(
      setIsReading,
      setMessage,
      setConnectionError, // Pass the setConnectionError function
      setSensorValues
    );
  };

  // Handle sensor removal from dashboard and sidebar
  const handleRemoveSensor = (sensor) => {
    // Remove the sensor from selectedSensors (sidebar)
    setSelectedSensors((prevSelected) =>
      prevSelected.filter((s) => s !== sensor)
    );
  };

  useEffect(() => {
    setSensorData((prevData) => {
      const updatedData = { ...prevData };

      Object.keys(sensorValues).forEach((key) => {
        if (prevData[key]) {
          updatedData[key] = [sensorValues[key], ...prevData[key].slice(0, -1)];
        }
      });

      return updatedData;
    });
  }, [sensorValues]); // Runs whenever sensorValues changes

  useEffect(() => {
    if (!isReading) {
      // Only generate random data if not reading from the serial port
      const interval = setInterval(() => {
        setSensorValues({
          throttle1: parseFloat((Math.random() * 100).toFixed(1)),
          throttle2: parseFloat((Math.random() * 100).toFixed(1)),
          brakePressure: parseFloat((Math.random() * 100).toFixed(1)),
          torque: parseFloat((Math.random() * 100).toFixed(1)),
          speed: parseFloat((Math.random() * 100).toFixed(1)),
          coolantTemp: parseFloat((Math.random() * 200).toFixed(1)),
          batteryPerc: parseFloat((Math.random() * 100).toFixed(1)),
          batteryTemp: parseFloat((Math.random() * 100).toFixed(1)),
          tractive: parseFloat((Math.random() * 100).toFixed(1)),
          currentDraw: parseFloat((Math.random() * 15).toFixed(1)),
          range: parseFloat((Math.random() * 30).toFixed(1)),
        });
      }, 1000);

      return () => clearInterval(interval); // Cleanup when component unmounts or `isReading` changes
    }
  }, [isReading]); // Depend on `isReading` so it updates when the connection status changes

  // return (
  //   <div>
  //     <h1>Please message Cole for the LiveTelemetry Beta Build</h1>
  //   </div>
  // );

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
        <SpeedDisplay data={sensorValues} />
        <div className="sensorBody">
          <SensorSidebar
            selectedSensors={selectedSensors}
            setSelectedSensors={setSelectedSensors} // Passing setSelectedSensors here
            sensorData={sensorData}
            availableSensors={availableSensors}
            handleRemoveSensor={handleRemoveSensor}
          />
          <Dashboard
            sensorData={sensorData}
            sensorValues={sensorValues}
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
