import DataView from "./DataView";
import ListView from "./ListView";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid"; // Use Grid instead of Grid2
import { useState, useEffect, useRef } from "react";
import { LoadScript } from "@react-google-maps/api";

function Analytics({ driveList, setDriveList, setCachedData, cachedData }) {
  // Ensure correct destructuring
  const [sensorData, setSensorData] = useState({}); // Stores sensor data for each drive
  const [loadingSensors, setLoadingSensors] = useState(false);
  const pendingFetches = useRef({});
  // Function to handle accordion expand and fetch sensors
  const handleExpand = async (driveId, isExpanded) => {
    if (isExpanded && !sensorData[driveId]) {
      setLoadingSensors(true);
      const response = await fetch(
        `http://192.168.86.25:8000/sensors/${driveId}`
      );
      const sensors = await response.json();

      var sensorsV2 = {};

      for (let i = 0; i < sensors.length; i++) {
        sensorsV2[sensors[i]] = false;
      }
      setSensorData((prevData) => ({
        ...prevData,
        [driveId]: sensorsV2, // Store sensors for the specific drive
      }));
      setLoadingSensors(false);
    }
  };

  // Fetch drives on component mount
  const getDrives = async () => {
    async function fetchDrives() {
      const response = await fetch("http://192.168.86.25:8000/drive");
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
    <Box sx={{ flexGrow: 1, height: "calc(100vh - 70px)" }}>
      <Grid container spacing={2} sx={{ height: "100%" }}>
        <Grid
          item
          xs={12}
          sm={3}
          sx={{
            maxWidth: "15vw",
            flexBasis: "auto",
            flexGrow: 0,
          }}
        >
          <ListView
            driveList={driveList}
            handleExpand={handleExpand}
            sensorData={sensorData}
            loadingSensor={loadingSensors}
            cachedData={cachedData}
            setCachedData={setCachedData}
            setSensorData={setSensorData}
            pendingFetches={pendingFetches}
          />
        </Grid>
        <Grid item xs={12} sm={true} sx={{ height: "100%" }}>
          <DataView
            cachedData={cachedData}
            setCachedData={setCachedData}
            sensorData={sensorData}
            setSensorData={setSensorData}
            pendingFetches={pendingFetches}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default Analytics;
