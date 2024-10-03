import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import id_map from "../idMap";

function SensorChart({ sensorIds, dataSets, onRemove, onDrop }) {
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
      <LineChart width={600} height={300}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" />
        <YAxis />
        <Tooltip />
        <Legend />
        {dataSets.map(({ sensorId, data }) => (
          <Line
            key={sensorId}
            type="monotone"
            data={data}
            dataKey="value"
            stroke="#8884d8"
            name={id_map[sensorId]} // Name for the legend
          />
        ))}
      </LineChart>
    </div>
  );
}

export default SensorChart;
