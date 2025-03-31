import { React } from "react";
import GridLayout from "react-grid-layout";
import SensorGraph from "./SensorGraph.js";
import "react-grid-layout/css/styles.css";
import "./componentCSS/Dashboard.css";
import { useSensors } from "./context/SensorContext.tsx";

const Dashboard = () => {
  // Ensure selectedSensors is always an array and sensorData is an object
  const { setSelectedSensors, dashboardSensors, setDashboardSensors } =
    useSensors();

  const handleDrop = (e) => {
    e.preventDefault();

    try {
      const droppedData = e.dataTransfer.getData("Number");
      let sensorId = droppedData;


      console.log("Processing drop for sensor ID:", sensorId);

      // Check if the sensor is already in the dashboard
      if (dashboardSensors.includes(sensorId)) {
        return;
      }

      // Add to dashboard sensors
      setDashboardSensors((prev) => [...prev, sensorId]);

      // Remove from selected sensors (sidebar)
      setSelectedSensors((prev) =>
        prev.filter((id) => Number(id) !== Number(sensorId)));
    } catch (error) {
      console.error("Error in drop handler:", error);
    }
  };


  // console.log(dashboardSensors);
  return (
    <div
      className="layout"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="dashboard">
        <h1>Dashboard</h1>
        <GridLayout cols={6} rowHeight={100} width={1200}>
          {dashboardSensors &&
            dashboardSensors.map((sensorId) => {
              console.log("Rendering sensor in dashboard:", sensorId);
              return (
                <div
                  key={`dashboard-${sensorId}`}>
                  <SensorGraph sensorId={sensorId} />
                </div>
              );
            })}
        </GridLayout>
      </div>
    </div>
  );
};

export default Dashboard;
