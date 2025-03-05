import './componentCSS/SpeedDisplay.css'
import StackedBar from './StackedBar';
import './componentCSS/StackedBar.css'

const SpeedDisplay = ({data}) => {
  console.log(data); // For debugging, to check if data is coming in correctly


  return (
    <div className="displayContainer">
      <div className="leftContainer">
        <span>Coolant Temp: {data.coolantTemp} F</span>
        <span>Battery Temp: {data.batteryTemp} F</span>
        <span>Current Draw: {data.currentDraw} Amps</span>
        <span>Expected Range: {data.range} min</span>
      </div>
      <div className="speed">
        <span>{data.speed}</span>
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

