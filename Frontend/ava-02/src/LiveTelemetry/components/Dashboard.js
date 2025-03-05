import {React} from "react";
import GridLayout from "react-grid-layout";
import SensorGraph from "./SensorBox";

import "react-grid-layout/css/styles.css";
import './componentCSS/Dashboard.css'

const Dashboard = ({ selectedSensors = [], sensorData = {}, sensorValues }) => {
  // Ensure selectedSensors is always an array and sensorData is an object

  // Create the layout based on selectedSensors
  const layout = selectedSensors.map((sensor, index) => ({
    i: sensor,
    x: (index % 3) * 2,
    y: Math.floor(index / 3) * 2,
    w: 2,
    h: 2,
  }));

  return (
    <div className="layout">
      <h1>Dashboard</h1>
      <p>Throttle 1: {sensorValues.throttle1}</p>
      <p>Throttle 2: {sensorValues.throttle2}</p>
      <p>Brake Pressure: {sensorValues.brake}</p>
      <GridLayout layout={layout} cols={6} rowHeight={100} width={1200}>
        {selectedSensors.map((sensor) => (
          <div key={sensor} className="sensor-box">
            {/* Pass the correct sensor data to the SensorGraph */}
            <SensorGraph
              sensorName={sensor}
              data={sensorData[sensor] || []} // Fallback to empty array if no data is found
              sensorValues={sensorValues.batteryTemp}
            />
          </div>
        ))}
      </GridLayout>
    </div>
  );
};

export default Dashboard;
