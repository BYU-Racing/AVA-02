import { useState, useEffect, React } from "react";
// import Typography from "@mui/material/Typography";
import "../App.css";
import "./LiveTelemetry.css";
import Button from "@mui/material/Button";
import RssFeedIcon from "@mui/icons-material/RssFeed";
import SensorSidebar from "./components/SensorSidebar";
import Dashboard from "./components/Dashboard";
import {connectSerial} from "./Communication";

function LiveTelemetry() {
  // const [port, setPort] = useState(null); // To store the selected port
  const [isReading, setIsReading] = useState(false); // Track if reading is in progress
  const [connectionError, setConnectionError] = useState(null); // Track any connection errors
  const [loraMessage, setMessage] = useState(null); // Message received from LoRA
  const [selectedSensors, setSelectedSensors] = useState([]);
  const [sensorValues, setSensorValues] = useState({
    throttle1: 0,
    throttle2: 0,
    torque: 0,
    brakePressure: 0,
    batteryPerc: 0,
    batteryTemp: 0,
    tractive: false,
  });
  const [sensorData, setSensorData] = useState({
    throttle1: [0, 0, 0, 0, 0],
    throttle2: [0, 0, 0, 0, 0],
    torque: [0, 0, 0, 0, 0],
    brakePressure: [0, 0, 0, 0, 0],
    batteryPerc: [0, 0, 0, 0, 0],
    batteryTemp: [0, 0, 0, 0, 0],
    tractive: [0, 0, 0, 0, 0],
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
      setSensorData((prevData) => ({
        throttle1: [Math.random() * 100, ...prevData.throttle1.slice(0, -1)],
        throttle2: [Math.random() * 100, ...prevData.throttle2.slice(0, -1)],
        brakePressure: [Math.random() * 100, ...prevData.brakePressure.slice(0, -1)],
        torque: [Math.random() * 100, ...prevData.torque.slice(0, -1)],
        batteryPerc: [Math.random() * 100, ...prevData.batteryPerc.slice(0, -1)],
        batteryTemp: [Math.random() * 100,...prevData.batteryTemp.slice(0, -1)],
        tractive: [Math.random() * 100, ...prevData.tractive.slice(0, -1)],
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
        <div>
          {connectionError && (
            <p style={{ color: "red" }}>Error: {connectionError}</p>
          )}

          <Button
            variant="contained"
            startIcon={<RssFeedIcon />}
            onClick={handleConnectClick}
            disabled={isReading}
          >
            Connect
          </Button>
        </div>
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
