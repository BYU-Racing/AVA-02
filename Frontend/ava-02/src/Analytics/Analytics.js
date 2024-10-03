import DataView from "./DataView";
import ListView from "./ListView";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid"; // Use Grid instead of Grid2
import { useState, useEffect } from "react";

function Analytics({ driveList, setDriveList }) {
  // Ensure correct destructuring
  const [sensorData, setSensorData] = useState({}); // Stores sensor data for each drive
  const [loadingSensors, setLoadingSensors] = useState(false);

  // Function to handle accordion expand and fetch sensors
  const handleExpand = async (driveId, isExpanded) => {
    if (isExpanded && !sensorData[driveId]) {
      setLoadingSensors(true);
      const response = await fetch(`http://127.0.0.1:8000/sensors/${driveId}`);
      const sensors = await response.json();
      setSensorData((prevData) => ({
        ...prevData,
        [driveId]: sensors, // Store sensors for the specific drive
      }));
      setLoadingSensors(false);
    }
  };

  // Fetch drives on component mount
  const getDrives = async () => {
    async function fetchDrives() {
      const response = await fetch("http://127.0.0.1:8000/drive");
      const data = await response.json();
      return data;
    }

    const drives = await fetchDrives();
    setDriveList(drives);
  };

  useEffect(() => {
    if (driveList.length === 0) {
      getDrives();
    }
  }, [driveList]);

  return (
    <Box sx={{ flexGrow: 1, height: "90vh" }}>
      {" "}
      {/* Set height to fill viewport */}
      <Grid container spacing={2} sx={{ height: "100%" }}>
        {" "}
        {/* Set height to 100% */}
        <Grid item xs={3}>
          <ListView
            driveList={driveList}
            handleExpand={handleExpand}
            sensorData={sensorData}
            loadingSensor={loadingSensors} // Pass sensor data to ListView
          />
        </Grid>
        <Grid item xs={7} sx={{ height: "100%", padding: 10 }}>
          {" "}
          {/* Ensure full height for DataView */}
          <DataView />
        </Grid>
      </Grid>
    </Box>
  );
}

export default Analytics;
