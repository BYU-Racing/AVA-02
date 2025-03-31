import React, { useEffect, useCallback, useRef } from "react";
import { Bar, Line } from "react-chartjs-2";
import { useSensors } from "./context/SensorContext.tsx"; // Remove .tsx extension
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register the necessary components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend
);

const SensorGraph = ({ sensorId }) => {
  const {
    handleRemoveSelectedSensor,
    getSensorById,
    Sensors, // Get all sensors as a backup
  } = useSensors();

  const barChartSensors = ["brakePressure", "throttle1", "throttle2"];
  const chartRef = useRef(null);

  // Log for debugging
  console.log(`SensorGraph rendering for sensorId: ${sensorId}`);

  // Get the sensor - first try with getSensorById, then fallback to finding it directly
  let sensor = getSensorById(Number(sensorId));

  // If that fails, find it directly in the Sensors array (backup)
  if (!sensor && Sensors && Array.isArray(Sensors)) {
    sensor = Sensors.find((s) => s.id === Number(sensorId));
    console.log(`Fallback sensor lookup: ${sensor ? "found" : "not found"}`);
  }

  // Log the result
  console.log(`Sensor for ID ${sensorId}:`, sensor);

  // Generate chart data for time series (line chart) with safety checks
  // MOVED TO TOP LEVEL - no conditionals before hooks
  const generateTimeSeriesData = useCallback(() => {
    try {
      if (!sensor) return { labels: [], datasets: [] };

      if (Array.isArray(sensor.data)) {
        return {
          labels: Array.from({ length: sensor.data.length }, (_, i) => i),
          datasets: [
            {
              label: sensor.name || "Unknown",
              data: sensor.data,
              borderColor: "rgb(24, 118, 209)",
              backgroundColor: "rgba(24, 118, 209, 0.5)",
              borderWidth: 2,
              fill: false,
            },
          ],
        };
      } else {
        return {
          labels: ["Current Value"],
          datasets: [
            {
              label: sensor.name || "Unknown",
              data: [sensor.data ?? 0], // Use nullish coalescing to handle null/undefined
              borderColor: "rgb(24, 118, 209)",
              backgroundColor: "rgba(24, 118, 209, 0.5)",
              borderWidth: 2,
              fill: false,
            },
          ],
        };
      }
    } catch (error) {
      console.error("Error generating time series data:", error);
      return { labels: [], datasets: [] }; // Return empty data on error
    }
  }, [sensor]);

  // Generate chart data for bar chart with safety checks
  // MOVED TO TOP LEVEL - no conditionals before hooks
  const generateBarChartData = useCallback(() => {
    try {
      if (!sensor) return { labels: [], datasets: [] };

      if (Array.isArray(sensor.data)) {
        return {
          labels: ["Current Value"],
          datasets: [
            {
              label: sensor.name || "Unknown",
              data: sensor.data.length > 0 ? [sensor.data[0]] : [0],
              backgroundColor: "rgb(24, 118, 209)",
              borderColor: "rgb(24, 118, 209)",
              borderWidth: 1,
            },
          ],
        };
      } else {
        return {
          labels: ["Current Value"],
          datasets: [
            {
              label: sensor.name || "Unknown",
              data: [sensor.data ?? 0],
              backgroundColor: "rgb(24, 118, 209)",
              borderColor: "rgb(24, 118, 209)",
              borderWidth: 1,
            },
          ],
        };
      }
    } catch (error) {
      console.error("Error generating bar chart data:", error);
      return { labels: [], datasets: [] }; // Return empty data on error
    }
  }, [sensor]);

  // Chart cleanup
  // MOVED TO TOP LEVEL - no conditionals before hooks
useEffect(() => {
  // Store the reference in a variable that will be captured in the closure
  const currentChartRef = chartRef.current;

  return () => {
    try {
      // Use the captured value instead of accessing chartRef.current directly
      if (currentChartRef && currentChartRef.chart) {
        currentChartRef.chart.destroy();
      }
    } catch (error) {
      console.error("Error cleaning up chart:", error);
    }
  };
}, []);

  // Safety function for getting latest value
  const getLatestValue = () => {
    try {
      if (!sensor) return "N/A";

      if (Array.isArray(sensor.data)) {
        return sensor.data.length > 0 ? sensor.data[0] : "N/A";
      }

      return sensor.data !== undefined && sensor.data !== null
        ? sensor.data.toString()
        : "N/A";
    } catch (error) {
      console.error("Error getting latest value:", error);
      return "Error";
    }
  };

  // Safety check if sensor doesn't exist
  if (!sensor) {
    return (
      <div
        className="sensor-box error"
        style={{
          padding: "15px",
          backgroundColor: "#ff000033",
          color: "white",
        }}
      >
        <p>Sensor ID {sensorId} not found</p>
        <button
          className="close-btn"
          onClick={() => handleRemoveSelectedSensor(sensorId)}
          style={{ position: "absolute", top: "5px", right: "5px" }}
        >
          X
        </button>
      </div>
    );
  }

  // Handle boolean data type with safety checks
  if (sensor && typeof sensor.data === "boolean") {
    return (
      <div
        className="sensor-box"
        draggable
        onDragStart={(e) => {
          // Set the sensor ID as the drag data
          e.dataTransfer.setData(
            "text/plain",
            JSON.stringify({
              id: sensorId,
              name: sensor.name,
            })
          );
          // For compatibility with older code
          e.dataTransfer.setData("Number", sensorId.toString());
          // Set drag effect
          e.dataTransfer.effectAllowed = "move";
        }}
      >
        <button
          className="close-btn"
          onClick={() => handleRemoveSelectedSensor(sensorId)}
        >
          X
        </button>
        <h3 style={{ color: "white" }}>{sensor.name}</h3>
        <div className="boolean-indicator">
          <div className={`indicator ${sensor.data ? "on" : "off"}`}></div>
          <p style={{ color: "white" }}>{sensor.data ? "ON" : "OFF"}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="sensor-box"
      draggable
      onDragStart={(e) => {
        try {
          // Set the sensor ID as the drag data in two formats
          e.dataTransfer.setData(
            "text/plain",
            JSON.stringify({
              id: sensorId,
              name: sensor.name,
            })
          );
          // For compatibility with older code
          e.dataTransfer.setData("Number", sensorId.toString());
          // Set drag effect
          e.dataTransfer.effectAllowed = "move";
        } catch (error) {
          console.error("Error in drag start:", error);
        }
      }}
    >
      <button
        className="close-btn"
        onClick={() => handleRemoveSelectedSensor(sensorId)}
      >
        X
      </button>
      <p style={{ color: "white" }}>{sensor.name}</p>
      <p style={{ color: "white" }}>Latest Value: {getLatestValue()}</p>
      <div>
        {(() => {
          try {
            // Determine which chart to show with safety checks
            const isBarChart =
              !Array.isArray(sensor.data) ||
              sensor.data.length === 1 ||
              (sensor.name && barChartSensors.includes(sensor.name));

            if (isBarChart) {
              return (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    flexDirection: "row",
                    flexGrow: 1,
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <Bar
                    ref={chartRef}
                    data={generateBarChartData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      indexAxis: "x",
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                    }}
                  />
                </div>
              );
            } else {
              return (
                <Line
                  ref={chartRef}
                  data={generateTimeSeriesData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
              );
            }
          } catch (error) {
            console.error("Error rendering chart:", error);
            return <p style={{ color: "red" }}>Error displaying chart</p>;
          }
        })()}
      </div>
    </div>
  );
};

export default SensorGraph;
