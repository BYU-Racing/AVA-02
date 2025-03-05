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
    // Simulate receiving new data (in real scenario, it would come from your car's system)
    const interval = setInterval(() => {
      const newData = {
        throttle1: (Math.random() * 100).toFixed(1),
        throttle2: (Math.random() * 100).toFixed(1),
        brakePressure: (Math.random() * 100).toFixed(1),
        torque: (Math.random() * 100).toFixed(1),
        speed: (Math.random() * 100).toFixed(1),
        coolantTemp: (Math.random() * 200).toFixed(1),
        batteryPerc: (Math.random() * 100).toFixed(1),
        batteryTemp: (Math.random() * 100).toFixed(1),
        tractive: (Math.random() * 100).toFixed(1),
        currentDraw: (Math.random() * 15).toFixed(1),
        range: (Math.random() * 30).toFixed(1),
      };

      setSensorData((prevData) => ({
        throttle1: [
          parseFloat(newData.throttle1),
          ...prevData.throttle1.slice(0, -1),
        ],
        throttle2: [
          parseFloat(newData.throttle2),
          ...prevData.throttle2.slice(0, -1),
        ],
        brakePressure: [
          parseFloat(newData.brakePressure),
          ...prevData.brakePressure.slice(0, -1),
        ],
        torque: [parseFloat(newData.torque), ...prevData.torque.slice(0, -1)],
        speed: [parseFloat(newData.speed), ...prevData.speed.slice(0, -1)],
        coolantTemp: [
          parseFloat(newData.coolantTemp),
          ...prevData.coolantTemp.slice(0, -1),
        ],
        batteryPerc: [
          parseFloat(newData.batteryPerc),
          ...prevData.batteryPerc.slice(0, -1),
        ],
        batteryTemp: [
          parseFloat(newData.batteryTemp),
          ...prevData.batteryTemp.slice(0, -1),
        ],
        tractive: [
          parseFloat(newData.tractive),
          ...prevData.tractive.slice(0, -1),
        ],
        currentDraw: [
          parseFloat(newData.tractive),
          ...prevData.currentDraw.slice(0, -1),
        ],
      }));

      // Also update sensorValues with the new data
      setSensorValues((prevValues) => ({
        ...prevValues,
        throttle1: parseFloat(newData.throttle1),
        throttle2: parseFloat(newData.throttle2),
        brakePressure: parseFloat(newData.brakePressure),
        torque: parseFloat(newData.torque),
        speed: parseFloat(newData.speed),
        coolantTemp: parseFloat(newData.coolantTemp),
        batteryPerc: parseFloat(newData.batteryPerc),
        batteryTemp: parseFloat(newData.batteryTemp),
        tractive: parseFloat(newData.tractive),
        currentDraw: parseFloat(newData.currentDraw),
        range: parseFloat(newData.range),
      }));
    }, 1000); // Simulating data every second

    return () => clearInterval(interval); // Clean up on unmount
  }, []);



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
            <p style={{ color: "red" }}>Error: {connectionError}</p>
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
