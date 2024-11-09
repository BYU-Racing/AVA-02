import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Divider from "@mui/material/Divider";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import id_map from "../idMap";
import errorMap from "../errorMap";
import LineChartComponent from "./LineChartComponent";
import ErrorCodesTableComponent from "./ErrorCodesTableComponent";

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

  const cardStyle = {
    borderRadius: "12px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    marginBottom: "16px",
  };

  if (sensorIds.length === 1 && sensorIds[0] === "204") {
    return (
      <Card style={cardStyle}>
        <CardHeader
          title={
            <Typography variant="h6">
              {sensorIds.map((id) => id_map[id]).join(", ")}
            </Typography>
          }
          action={
            <IconButton onClick={onRemove} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        />
        <Divider />
        <CardContent>
          <ErrorCodesTableComponent
            data={dataSets[0].data}
            errorMap={errorMap}
            onRemove={onRemove}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card style={cardStyle}>
      <CardHeader
        title={
          <Typography variant="h6">
            {sensorIds.map((id) => id_map[id]).join(", ")}
          </Typography>
        }
        action={
          <IconButton onClick={onRemove} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
      <Divider />
      <CardContent onDrop={onDrop} onDragOver={(e) => e.preventDefault()}>
        <LineChartComponent
          dataSets={dataSets}
          sensorIds={sensorIds}
          colors={colors}
          id_map={id_map}
        />
      </CardContent>
    </Card>
  );
}

export default SensorChart;
