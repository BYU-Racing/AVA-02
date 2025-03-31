import './componentCSS/SpeedDisplay.css'
import StackedBar from './StackedBar';
import './componentCSS/StackedBar.css'
import React from 'react';
import { useSensors } from "./context/SensorContext.tsx";

const SpeedDisplay = () => {
  // console.log(data); // For debugging, to check if data is coming in correctly
  const { getSensorByName } = useSensors();
  const speed = getSensorByName("speed");
  const batteryTemp = getSensorByName("bsm_batteryTemp");
  const currentDraw = getSensorByName("bsm_current");
  const expectedRange = getSensorByName("range");
  const coolantTemp = getSensorByName("mc_coolantTemp");


  return (
    <div className="displayContainer">
      <div className="leftContainer">
        <span>Coolant Temp: {coolantTemp.data[4]} F</span>
        <span>Battery Temp: {batteryTemp.data[4]} F</span>
        <span>Current Draw: {currentDraw.data[4]} Amps</span>
        <span>Expected Range: {expectedRange.data[4]} min</span>
      </div>
      <div className="speed">
        <span>{speed.data}</span>
        <span>MPH</span>
      </div>
      <div className="modeSelect">
        <select className="selectionBox">
          <option key={"autocross"}>Autocross</option>
          <option key={"endurance"}>Endurance</option>
        </select>
      </div>
      <div className="timer">
        <span>Current Run Time</span>
        <span>12:00:00</span>
      </div>
      <div className="ssiBar">
        <StackedBar maxValue={100} numSegments={7} />
        <div className="ssiTextContainer">
          <span className="ssiText">SSI Strength</span>
        </div>
      </div>
    </div>
  );
}


export default SpeedDisplay;

