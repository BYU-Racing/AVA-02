import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import SensorChart from "./SensorChart";
import {
  transforCANMessagesToTimeSeriesHEALTH,
  transformCANMessagesToTimeSeriesACCEL,
  transformCANMessagesToTimeSeriesANALOG,
  transformCANMessagesToTimeSeriesDIGITAL,
  transformCANmessagesToTimeSeriesGPS,
  transformCANMessagesToTimeSeriesHOTBOX,
  transformCANMessagesToTimeSeriesTORQUE,
} from "./CANtransformations";
import { v4 as uuidv4 } from "uuid";
import "./DataView.css";

function DataView({
  cachedData,
  setCachedData,
  sensorData,
  setSensorData,
  pendingFetches,
}) {
  const [sensorDataArray, setSensorDataArray] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalZoomBounds, setGlobalZoomBounds] = useState({
    left: "dataMin",
    right: "dataMax",
  });
  const [globalZoomHistory, setGlobalZoomHistory] = useState([]);
  const [globalZoomed, setGlobalZoomed] = useState(false);

  const handleDrop = async (event, targetChartId = null) => {
    event.preventDefault();
    event.stopPropagation();

    const sensorId = event.dataTransfer.getData("sensorId");
    const driveId = event.dataTransfer.getData("driveId");

    if (driveId === "" || sensorId === "") {
      return;
    }

    const targetChartIndex = sensorDataArray.findIndex(
      ({ chartId }) => chartId === targetChartId
    );

    if (sensorId === "204" || sensorId === "9") {
      return;
    }

    setLoading(true);

    try {
      let timeSeriesData = [];

      if (targetChartIndex >= 0) {
        const updatedCharts = [...sensorDataArray];
        updatedCharts[targetChartIndex].dataSets.push({
          driveId,
          sensorId,
          data: timeSeriesData ?? [],
        });
        updatedCharts[targetChartIndex].sensorIds.push({ driveId, sensorId });
        setSensorDataArray(updatedCharts);
      } else if (targetChartId === null) {
        setSensorDataArray((prevArray) => [
          ...prevArray,
          {
            chartId: uuidv4(),
            sensorIds: [{ driveId, sensorId }],
            dataSets: [{ driveId, sensorId, data: timeSeriesData ?? [] }],
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

  useEffect(() => {
    if (sensorDataArray.length === 0) {
      setGlobalZoomBounds({ left: "dataMin", right: "dataMax" });
      setGlobalZoomed(false);
    }
  }, [sensorDataArray.length]);

  return (
    <Box
      sx={{
        backgroundColor: "#ffffff",
        margin: "8px",
        height: "100%",
        width: "100%",
        boxSizing: "border-box",
        position: "relative",
        minHeight: "400px",
        overflowY: "auto",
        overflowX: "hidden",
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
                  setGlobalZoomHistory={setGlobalZoomHistory}
                  globalZoomHistory={globalZoomHistory}
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
