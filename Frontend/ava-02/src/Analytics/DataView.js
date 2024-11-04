import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import SensorChart from "./SensorChart";
import {
  transformCANMessagesToTimeSeriesANALOG,
  transformCANMessagesToTimeSeriesDIGITAL,
  transformCANMessagesToTimeSeriesHOTBOX,
  transformCANMessagesToTimeSeriesTORQUE,
} from "./CANtransformations";
import { v4 as uuidv4 } from "uuid"; // Use uuid to generate unique IDs

function DataView() {
  const [sensorDataArray, setSensorDataArray] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleDrop = async (event, targetChartId = null) => {
    event.preventDefault();
    event.stopPropagation(); // Ensure drop does not propagate further

    const sensorId = event.dataTransfer.getData("sensorId");
    const driveId = event.dataTransfer.getData("driveId");

    // Find the chart that the data is being dropped onto
    const targetChartIndex = sensorDataArray.findIndex(
      ({ chartId }) => chartId === targetChartId
    );

    setLoading(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/data/${driveId}/${sensorId}`
      );
      const canMessages = await response.json();

      // Transform the CAN messages to time series
      let timeSeriesData;
      if (sensorId === "0") {
        timeSeriesData = transformCANMessagesToTimeSeriesDIGITAL(canMessages);
      } else if (sensorId === "192") {
        timeSeriesData = transformCANMessagesToTimeSeriesTORQUE(canMessages);
      } else if (
        sensorId === "500" ||
        sensorId === "501" ||
        sensorId === "502"
      ) {
        timeSeriesData = transformCANMessagesToTimeSeriesHOTBOX(canMessages);
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
      } else if (targetChartId === null) {
        // If dropped in a blank space, create a new chart with a unique chartId
        setSensorDataArray((prevArray) => [
          ...prevArray,
          {
            chartId: uuidv4(), // Generate a unique ID for the chart
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

  const removeChart = (chartId) => {
    setSensorDataArray(
      (prevArray) => prevArray.filter(({ chartId: id }) => id !== chartId) // Remove chart by its unique chartId
    );
  };

  return (
    <Box
      sx={{
        backgroundColor: "#ffffff",
        margin: "16px",
        height: "100%",
        width: "120%",
        boxSizing: "border-box",
      }}
      onDrop={(event) => handleDrop(event, null)} // Only create new chart if targetChartId is null
      onDragOver={handleDragOver}
    >
      {sensorDataArray.length > 0 && (
        <div>
          {sensorDataArray.map(({ chartId, sensorIds, dataSets }) => (
            <SensorChart
              key={chartId} // Use the unique chartId as key
              chartId={chartId} // Pass chartId to the SensorChart component
              sensorIds={sensorIds}
              dataSets={dataSets}
              onRemove={() => removeChart(chartId)} // Remove by unique chartId
              onDrop={(event) => {
                event.stopPropagation(); // Stop propagation so only one drop event is triggered
                handleDrop(event, chartId); // Allow dropping onto this chart
              }}
            />
          ))}
        </div>
      )}
    </Box>
  );
}

export default DataView;
