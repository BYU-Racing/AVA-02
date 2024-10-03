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

function SensorChart({ sensorId, data, onRemove }) {
  return (
    <div style={{ position: "relative", marginBottom: "16px" }}>
      <Typography variant="h6">
        {id_map[sensorId]}:
        <IconButton onClick={onRemove} size="small">
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
}

export default SensorChart;
