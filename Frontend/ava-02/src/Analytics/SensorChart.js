import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
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

  return (
    <div
      style={{ position: "relative", marginBottom: "16px" }}
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <Typography variant="h6">
        {sensorIds.map((id) => id_map[id]).join(", ")}:
        <IconButton onClick={onRemove} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Typography>

      {sensorIds.length === 1 && sensorIds[0] === "204" ? (
        <ErrorCodesTableComponent
          data={dataSets[0].data}
          errorMap={errorMap}
          onRemove={onRemove}
        />
      ) : (
        <LineChartComponent
          dataSets={dataSets}
          sensorIds={sensorIds}
          colors={colors}
          id_map={id_map}
        />
      )}
    </div>
  );
}

export default SensorChart;
