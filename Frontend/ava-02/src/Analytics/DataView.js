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

const SensorChart = ({ sensorId, data, onRemove }) => (
  <div style={{ position: "relative", marginBottom: "16px" }}>
    <Typography variant="h6">
      {id_map[sensorId]}:
      <IconButton
        onClick={onRemove}
        size="small"
        style={{ position: "absolute", right: 0, top: 0 }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Typography>
    <LineChart width={600} height={300} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="timestamp" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="value" stroke="#8884d8" />
    </LineChart>
  </div>
);

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
    event.preventDefault(); // Prevent default to allow drop
  };

  const removeChart = (sensorId) => {
    // Filter out the sensorId to remove the chart from the array
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
