import {React, useEffect, useState} from "react";
import RGL, { WidthProvider} from "react-grid-layout";
import SensorGraph from "./SensorBox";
import "react-grid-layout/css/styles.css";
import './componentCSS/Dashboard.css'

const ReactGridLayout = WidthProvider(RGL);

const Dashboard = ({ 
    sensorData = {}, 
    setSelectedSensors, 
    handleRemoveSensor
  }) => {
    // Ensure selectedSensors is always an array and sensorData is an object
    const [displayedSensors, setDisplayedSensors] = useState([]);

    const handleDrop = (sensorName) => {
      if (!displayedSensors.includes(sensorName)) {
        setDisplayedSensors([...displayedSensors, sensorName]);
      }
      // Remove the sensor from the Sidebar (update selectedSensors in LiveTelemetry)
      setSelectedSensors((prev) =>
        prev.filter((sensor) => sensor !== sensorName)
      );
    };

    const handleRemoveFromDashboard = (sensorName) => {
      // Remove the sensor from displayedSensors (dashboard)
      setDisplayedSensors((prevDisplayed) =>
        prevDisplayed.filter((sensor) => sensor !== sensorName)
      );
      // Remove the sensor from the Sidebar (selectedSensors)
      handleRemoveSensor(sensorName);
    };


    // Create the layout based on selectedSensors
    const [layout, setLayout] = useState([]);
    useEffect(() => {
      const newLayout = displayedSensors.map((sensor, index) => ({
        i: sensor,
        x: (index % 3) * 2,
        y: Math.floor(index / 3) * 2,
        w: 2,
        h: 2,
      }));
      
      console.log(newLayout);
      setLayout(newLayout);
    }, [displayedSensors]);
  
    return (
      <div
        className="layout"
        onDrop={(e) => handleDrop(e.dataTransfer.getData("text"))}
        onDragOver={(e) => e.preventDefault()}
      >
        <div className="dashboard">
          <h1>Dashboard</h1>
          <ReactGridLayout 
            key={layout.length}
            layout={layout}
            onLayoutChange={(layout) => console.log(layout)}
            cols={6} 
            rowHeight={100} 
            width={1200}
            isResizable={true}
            isDraggable={true}
            resizeHandles={['se']}
          >
            {displayedSensors.map((sensor) => (
              <SensorGraph
                key={sensor}
                sensorName={sensor}
                data={sensorData[sensor]}
                handleRemoveSensor={handleRemoveFromDashboard} // Pass removeSensor function to SensorBox
              />
            ))}
          </ReactGridLayout>
        </div>
      </div>
    );
  };

export default Dashboard;
