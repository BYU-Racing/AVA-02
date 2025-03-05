import { useState, useEffect, React } from "react";
// import Typography from "@mui/material/Typography";
import "../App.css";
import "./LiveTelemetry.css";
import Button from "@mui/material/Button";
import RssFeedIcon from "@mui/icons-material/RssFeed";
import SensorSidebar from "./components/SensorSidebar";
import Dashboard from "./components/Dashboard";
import { TableBody } from "@mui/material";
import { connectSerial } from "./Communication";

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
    batteryTemp:0,
    tractive: false,
    loraMessage: []
  });
  const [sensorData, setSensorData] = useState({
      throttle1: [0, 0, 0, 0, 0],
      throttle2: [0, 0, 0, 0, 0],
      brake: [0, 0, 0, 0, 0],
      torque: [0, 0, 0, 0, 0],
      batteryP: [0, 0, 0, 0, 0],
      batteryTemp: [0, 0, 0, 0, 0],
      tractive: [0, 0, 0, 0, 0],
    });


  const handleConnectClick = () => {
    // Call the connectSerial function when the button is clicked
    connectSerial(
      setIsReading,
      setMessage,
      setConnectionError, // Pass the setConnectionError function
      setSensorValues
    );
  };


  useEffect(() => {
    // Simulate receiving new data (in real scenario, it would come from your car's system)
    const interval = setInterval(() => {
      setSensorData((prevData) => ({
        throttle1: [...prevData.throttle1.slice(1), Math.random() * 100],
        throttle2: [...prevData.throttle2.slice(1), Math.random() * 100],
        brake: [...prevData.brake.slice(1), Math.random() * 100],
        torque: [...prevData.torque.slice(1), Math.random() * 100],
        batteryP: [...prevData.batteryP.slice(1), Math.random() * 100],
        batteryTemp: [...prevData.batteryTemp.slice(1), Math.random() * 100],
        tractive: [...prevData.tractive.slice(1), Math.random() * 100],
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
      <body className="liveTelemetryBody">
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
          />
          <Dashboard sensorValues={sensorValues} />
        </div>
      </body>
    </>
  );
}

export default LiveTelemetry;
