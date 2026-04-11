import DataView from "./DataView";
import ListView from "./ListView";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid"; // Use Grid instead of Grid2
import { useState, useEffect, useRef } from "react";

const DRIVE_REFRESH_INTERVAL_MS = 15000;

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
        `/api/sensors/${driveId}`
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

  const handleDelete = async (driveId, deletepassword) => {
    const response = await fetch(`/api/drive/${driveId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: deletepassword }),
    });

    if (response.ok) {
      setDriveList((prev) => prev.filter((d) => d.drive_id !== driveId));
      setCachedData((prev) => {
        const next = { ...prev };
        delete next[driveId];
        return next;
      });
      return;
    }

    let errorMessage = "Failed to delete drive";
    try {
      const errorData = await response.json();
      if (errorData?.detail) {
        errorMessage = errorData.detail;
      }
    } catch {
      // Ignore JSON parse failures and use fallback message.
    }

    throw new Error(errorMessage);
  };

  const handleDownload = async (driveId) => {
    const response = await fetch(`/api/drive/${driveId}/csv`);

    if (response.ok) {
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="([^"]+)"/);
      const filename = filenameMatch?.[1] || `drive_${driveId}.csv`;
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      return;
    }

    let errorMessage = "Failed to download drive CSV";
    try {
      const errorData = await response.json();
      if (errorData?.detail) {
        errorMessage = errorData.detail;
      }
    } catch {
      // Ignore JSON parse failures and use fallback message.
    }

    throw new Error(errorMessage);
  };

  const syncCachedDataWithDrives = (drives) => {
    setCachedData((prev) => {
      const next = {};

      drives.forEach((drive) => {
        const driveKey = String(drive.drive_id);
        next[driveKey] = prev[driveKey] || {};
      });

      return next;
    });
  };

  // Fetch drives on component mount
  const getDrives = async () => {
    async function fetchDrives() {
      const response = await fetch("/api/drive");
      if (!response.ok) {
        throw new Error(`Failed to fetch drives (${response.status})`);
      }
      const data = await response.json();
      return data;
    }

    try {
      const drives = await fetchDrives();
      setDriveList(drives);
      syncCachedDataWithDrives(drives);
    } catch (error) {
      console.error("Failed to refresh drives for analytics:", error);
    }
  };

  useEffect(() => {
    getDrives();
    const intervalId = setInterval(() => {
      getDrives();
    }, DRIVE_REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
    // Intentionally refresh every time Analytics mounts and periodically
    // afterwards so newly-created live drives appear without a full reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box sx={{ flexGrow: 1, height: "calc(100vh - 70px)" }}>
      <Grid container spacing={2} sx={{ height: "100%" }}>
        <Grid
          item
          xs={12}
          sm={3}
          sx={{
            maxWidth: "15vw",
            minWidth: "15vw",
            flexBasis: "15vw",
            flexGrow: 0,
            flexShrink: 0,
          }}
        >
          <ListView
            driveList={driveList}
            handleExpand={handleExpand}
            sensorData={sensorData}
            loadingSensors={loadingSensors}
            cachedData={cachedData}
            setCachedData={setCachedData}
            setSensorData={setSensorData}
            pendingFetches={pendingFetches}
            handleDelete={handleDelete}
            handleDownload={handleDownload}
          />
        </Grid>
        <Grid
          item
          xs={12}
          sm={true}
          sx={{
            height: "100%",
            maxWidth: "85vw",
            flexGrow: 1,
            overflowX: "hidden",
            overflowY: "hidden",
          }}
        >
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
