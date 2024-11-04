import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import id_map from "../idMap";
import { Button } from "@mui/material";
import errorMap from "../errorMap";

function SensorChart({ chartId, sensorIds, dataSets, onRemove, onDrop }) {
  const colors = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7300",
    "#ff0000",
    "#0088fe",
    "#00c49f",
    "#f33e77",
  ];

  const [left, setLeft] = useState("dataMin");
  const [right, setRight] = useState("dataMax");
  const [refAreaLeft, setRefAreaLeft] = useState("");
  const [refAreaRight, setRefAreaRight] = useState("");
  const [zoomed, setZoomed] = useState(false);

  // Zoom functionality (only for the X-axis)
  const zoom = () => {
    if (refAreaLeft === refAreaRight || !refAreaRight) {
      setRefAreaLeft("");
      setRefAreaRight("");
      return;
    }

    // Ensure correct ordering of left and right timestamps
    let [newLeft, newRight] =
      refAreaLeft > refAreaRight
        ? [refAreaRight, refAreaLeft]
        : [refAreaLeft, refAreaRight];

    setLeft(newLeft);
    setRight(newRight);
    setRefAreaLeft("");
    setRefAreaRight("");
    setZoomed(true);
  };

  // Reset zoom to initial state
  const zoomOut = () => {
    setLeft("dataMin");
    setRight("dataMax");
    setZoomed(false);
  };
  if (sensorIds.length === 1 && sensorIds[0] === "204") {
    // Count occurrences of each unique value in dataSets[0].data
    const valueCounts = dataSets[0].data.reduce((acc, entry) => {
      acc[entry.value] = (acc[entry.value] || 0) + 1;
      return acc;
    }, {});

    return (
      <div style={{ position: "relative", marginBottom: "16px" }}>
        <Typography variant="h6">
          Unique Values:
          <IconButton onClick={onRemove} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Typography>
        <ul>
          {Object.entries(valueCounts).map(([value, count]) => (
            <li key={value}>
              {errorMap[value]}: {count} errors
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <div
      style={{ position: "relative", marginBottom: "16px" }}
      onDrop={onDrop} // Allow dropping on the chart
      onDragOver={(e) => e.preventDefault()}
    >
      <Typography variant="h6">
        {sensorIds.map((id) => id_map[id]).join(", ")}:
        <IconButton onClick={onRemove} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Typography>

      {zoomed && (
        <Button
          variant="outlined"
          type="button"
          className="btn update"
          onClick={zoomOut}
        >
          Zoom Out
        </Button>
      )}

      {/* Wrapping the chart in ResponsiveContainer */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={dataSets[0].data} // Pass in the actual data for the chart
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
          onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel)} // Start zoom selection
          onMouseMove={(e) =>
            refAreaLeft && e && setRefAreaRight(e.activeLabel)
          } // Adjust right bound of zoom
          onMouseUp={zoom} // Apply zoom on mouse up
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            allowDataOverflow
            domain={[left, right]}
            type="number"
          />
          <YAxis domain={[0, "dataMax+1"]} /> {/* Always starts Y-axis at 0 */}
          <Tooltip />
          <Legend />
          {dataSets.map(({ sensorId, data }, index) => (
            <Line
              key={sensorId}
              type="monotone"
              data={data}
              dataKey="value"
              stroke={colors[index % colors.length]} // Assign color based on index
              name={id_map[sensorId]} // Name for the legend
              dot={false} // Disable dots on the line
            />
          ))}
          {refAreaLeft && refAreaRight ? (
            <ReferenceArea
              x1={refAreaLeft}
              x2={refAreaRight}
              strokeOpacity={0.3}
            />
          ) : null}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SensorChart;
