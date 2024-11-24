import { useState } from "react";
import Box from "@mui/material/Box";
import SensorChart from "./SensorChart";
import {
  transforCANMessagesToTimeSeriesHEALTH,
  transformCANMessagesToTimeSeriesACCEL,
  transformCANMessagesToTimeSeriesANALOG,
  transformCANMessagesToTimeSeriesDIGITAL,
  transformCANMessagesToTimeSeriesHOTBOX,
  transformCANMessagesToTimeSeriesTORQUE,
} from "./CANtransformations";
import { v4 as uuidv4 } from "uuid";
import "./DataView.css";

function DataView() {
  const [sensorDataArray, setSensorDataArray] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalZoomBounds, setGlobalZoomBounds] = useState({
    left: "dataMin",
    right: "dataMax",
  });
  const [globalZoomed, setGlobalZoomed] = useState(false);
  const handleDrop = async (event, targetChartId = null) => {
    event.preventDefault();
    event.stopPropagation();

    const sensorId = event.dataTransfer.getData("sensorId");
    const driveId = event.dataTransfer.getData("driveId");

    const targetChartIndex = sensorDataArray.findIndex(
      ({ chartId }) => chartId === targetChartId
    );

    setLoading(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/data/${driveId}/${sensorId}`
      );
      const canMessages = await response.json();

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
      } else if (
        sensorId === "400" ||
        sensorId === "401" ||
        sensorId === "402" ||
        sensorId === "403" ||
        sensorId === "404" ||
        sensorId === "405"
      ) {
        timeSeriesData = transformCANMessagesToTimeSeriesACCEL(canMessages);
      } else if (sensorId === "201" || sensorId === "202") {
        timeSeriesData = transforCANMessagesToTimeSeriesHEALTH(canMessages);
      } else {
        timeSeriesData = transformCANMessagesToTimeSeriesANALOG(canMessages);
      }

      if (targetChartIndex >= 0) {
        const updatedCharts = [...sensorDataArray];
        updatedCharts[targetChartIndex].dataSets.push({
          sensorId,
          data: timeSeriesData,
        });
        updatedCharts[targetChartIndex].sensorIds.push(sensorId);
        setSensorDataArray(updatedCharts);
      } else if (targetChartId === null) {
        setSensorDataArray((prevArray) => [
          ...prevArray,
          {
            chartId: uuidv4(),
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
    setSensorDataArray((prevArray) =>
      prevArray.filter(({ chartId: id }) => id !== chartId)
    );
  };

  return (
    <Box
      sx={{
        backgroundColor: "#ffffff",
        margin: "16px",
        height: "100%",
        width: "100%",
        boxSizing: "border-box",
        position: "relative",
        minHeight: "400px",
        overflow: "auto",
      }}
      className={`chart-container ${loading ? "loading" : ""}`}
      onDrop={(event) => handleDrop(event, null)}
      onDragOver={handleDragOver}
    >
      {sensorDataArray.length > 0 && (
        <div className="chart-container">
          {sensorDataArray.map(({ chartId, sensorIds, dataSets }) => (
            <div className="chart" key={chartId}>
              <div className="chart-content">
                <SensorChart
                  chartId={chartId}
                  sensorIds={sensorIds}
                  dataSets={dataSets}
                  onRemove={() => removeChart(chartId)}
                  onDrop={(event) => {
                    event.stopPropagation();
                    handleDrop(event, chartId);
                  }}
                  globalZoomBounds={globalZoomBounds}
                  setGlobalZoomBounds={setGlobalZoomBounds}
                  globalZoomed={globalZoomed}
                  setGlobalZoomed={setGlobalZoomed}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Box>
  );
}

export default DataView;
