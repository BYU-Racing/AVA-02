import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import {
  transformCANMessagesToTimeSeriesANALOG,
  transformCANMessagesToTimeSeriesDIGITAL,
} from "./CANtransformations";
import id_map from "../idMap";
import SensorChart from "./SensorChart";

function DataView() {
  const [sensorDataArray, setSensorDataArray] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleDrop = async (event) => {
    event.preventDefault();
    const sensorId = event.dataTransfer.getData("sensorId");
    const driveId = event.dataTransfer.getData("driveId");

    // Check if the sensor data is already present
    if (sensorDataArray.some((data) => data.sensorId === sensorId)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/data/${driveId}/${sensorId}`
      );
      const canMessages = await response.json();

      // Transform the CAN messages to time series
      let timeSeriesData;
      if (sensorId === 1) {
        timeSeriesData = transformCANMessagesToTimeSeriesDIGITAL(canMessages);
      } else {
        timeSeriesData = transformCANMessagesToTimeSeriesANALOG(canMessages);
      }

      setSensorDataArray((prevArray) => [
        ...prevArray,
        { sensorId, data: timeSeriesData },
      ]);
    } catch (error) {
      console.error("Error fetching sensor data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const removeChart = (sensorId) => {
    setSensorDataArray((prevArray) =>
      prevArray.filter((data) => data.sensorId !== sensorId)
    );
  };

  return (
    <Box
      sx={{
        backgroundColor: "#f5f5f5",
        borderRadius: "8px",
        padding: "16px",
        height: "100%",
        width: "100%",
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {loading ? (
        <Typography>Loading...</Typography>
      ) : (
        sensorDataArray.length > 0 && (
          <div>
            {sensorDataArray.map(({ sensorId, data }) => (
              <SensorChart
                key={sensorId}
                sensorId={sensorId}
                data={data}
                onRemove={() => removeChart(sensorId)} // Pass the remove function
              />
            ))}
          </div>
        )
      )}
    </Box>
  );
}

export default DataView;
