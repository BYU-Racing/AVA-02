import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import SensorChart from "./SensorChart";
import {
  transformCANMessagesToTimeSeriesANALOG,
  transformCANMessagesToTimeSeriesDIGITAL,
} from "./CANtransformations";

function DataView() {
  const [sensorDataArray, setSensorDataArray] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleDrop = async (event, targetSensorId = null) => {
    event.preventDefault();
    const sensorId = event.dataTransfer.getData("sensorId");
    const driveId = event.dataTransfer.getData("driveId");

    // Find the chart that the data is being dropped onto
    const targetChartIndex = sensorDataArray.findIndex(({ sensorIds }) =>
      sensorIds.includes(targetSensorId)
    );

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

      if (targetChartIndex >= 0) {
        // If dropped onto an existing chart, add the new line data
        const updatedCharts = [...sensorDataArray];
        updatedCharts[targetChartIndex].dataSets.push({
          sensorId,
          data: timeSeriesData,
        });
        updatedCharts[targetChartIndex].sensorIds.push(sensorId); // Add the sensorId to the chart
        setSensorDataArray(updatedCharts);
      } else {
        // If dropped in a blank space, create a new chart
        setSensorDataArray((prevArray) => [
          ...prevArray,
          {
            sensorIds: [sensorId],
            dataSets: [{ sensorId, data: timeSeriesData }],
          },
        ]);
      }
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
      prevArray.filter(({ sensorIds }) => !sensorIds.includes(sensorId))
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
            {sensorDataArray.map(({ sensorIds, dataSets }) => (
              <SensorChart
                key={sensorIds.join(",")}
                sensorIds={sensorIds}
                dataSets={dataSets}
                onRemove={() => removeChart(sensorIds[0])}
                onDrop={(event) => handleDrop(event, sensorIds[0])} // Allow dropping onto this chart
              />
            ))}
          </div>
        )
      )}
    </Box>
  );
}

export default DataView;
