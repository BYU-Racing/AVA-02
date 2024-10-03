import DataView from "./DataView";
import ListView from "./ListView";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import { useState, useEffect } from "react";

function Analytics({ driveList }, { setDriveList }) {
  const [sensorData, setSensorData] = useState({}); // Stores sensor data for each drive

  // Function to handle accordion expand and fetch sensors
  const handleExpand = async (driveId, isExpanded) => {
    if (isExpanded && !sensorData[driveId]) {
      const response = await fetch(`http://127.0.0.1:8000/sensors/${driveId}`);
      const sensors = await response.json();
      setSensorData((prevData) => ({
        ...prevData,
        [driveId]: sensors, // Store sensors for the specific drive
      }));
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
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={2}>
        <Grid item xs={2}>
          <ListView
            driveList={driveList}
            handleExpand={handleExpand}
            sensorData={sensorData} // Pass sensor data to ListView
          />
        </Grid>
        <Grid item xs={10}>
          <DataView />
        </Grid>
      </Grid>
    </Box>
  );
}

export default Analytics;
