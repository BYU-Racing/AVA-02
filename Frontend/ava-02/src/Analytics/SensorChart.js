import { useState } from "react";
import { ResizableBox } from "react-resizable";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import id_map from "../idMap";
import errorMap from "../errorMap";
import LineChartComponent from "./LineChartComponent";
import ErrorCodesTableComponent from "./ErrorCodesTableComponent";
import "react-resizable/css/styles.css";
import "./SensorChart.css";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Menu from "@mui/material/Menu";
import TuneIcon from "@mui/icons-material/Tune";
import PublicOffIcon from "@mui/icons-material/PublicOff";
import GPSMap from "./GPSMap";

function SensorChart({
  chartId,
  sensorIds,
  dataSets,
  onRemove,
  onDrop,
  setGlobalZoomBounds,
  globalZoomBounds,
  globalZoomed,
  setGlobalZoomed,
}) {
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
  const [zoomed, setZoomed] = useState(false);
  const [left, setLeft] = useState("dataMin");
  const [right, setRight] = useState("dataMax");
  const [min0, setMin0] = useState(true);

  const [globalZoom, setGlobalZoom] = useState(true);

  const handleGlobalZoomExcludeSwitch = (event) => {
    setGlobalZoom(event.target.checked);
  };

  const handleZoomOut = () => {
    if (globalZoom) {
      setGlobalZoomBounds({ left: "dataMin", right: "dataMax" });
      setGlobalZoomed(false);
      setZoomed(false);
    } else {
      setLeft("dataMin");
      setRight("dataMax");
      setZoomed(false);
    }
  };

  const handleSwitch = (event) => {
    setMin0(event.target.checked);
  };

  const [menuOpen, setMenuOpen] = useState(null);
  const open = Boolean(menuOpen);

  const handleOpen = (event) => {
    setMenuOpen(event.currentTarget);
  };

  const handleClose = () => {
    setMenuOpen(null);
  };

  let amIZoomed =
    left !== "dataMin" ||
    right !== "dataMax" ||
    (globalZoom &&
      globalZoomBounds.left !== "dataMin" &&
      globalZoomBounds.right !== "dataMax");

  // Determine the type of visualization
  const isTable = sensorIds.length === 1 && sensorIds[0] === "204";
  const isGPS = sensorIds.length === 1 && sensorIds[0] === "9";

  return (
    <Card
      style={{
        borderRadius: "12px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        marginBottom: "16px",
        overflow: "hidden",
        height: "100%",
      }}
    >
      <CardHeader
        sx={{
          padding: "10px 28px",
          "& .MuiTypography-root": {
            fontSize: "1rem",
          },
          "& .MuiIconButton-root": {
            padding: "5px",
          },
        }}
        title={
          <Typography variant="subtitle1" style={{ fontWeight: 500 }}>
            {sensorIds.map((id) => id_map[id]).join(", ")}
          </Typography>
        }
        action={
          <>
            {!globalZoom && (
              <PublicOffIcon
                style={{
                  marginRight: 8,
                  verticalAlign: "middle",
                }}
              />
            )}
            {amIZoomed && (
              <Button
                variant="outlined"
                onClick={handleZoomOut}
                size="small"
                style={{ marginRight: 8 }}
              >
                Reset
              </Button>
            )}

            {!isTable && !isGPS && (
              <>
                <IconButton
                  aria-label="delete"
                  aria-controls={open ? "basic-menu" : undefined}
                  aria-haspopup="true"
                  aria-expanded={open ? "true" : undefined}
                  onClick={handleOpen}
                  size="small"
                >
                  <TuneIcon />
                </IconButton>
                <Menu
                  id="basic-menu"
                  anchorEl={menuOpen}
                  open={open}
                  onClose={handleClose}
                  MenuListProps={{
                    "aria-labelledby": "basic-button",
                  }}
                >
                  <FormControlLabel
                    control={<Switch checked={min0} onChange={handleSwitch} />}
                    label="Min 0"
                    labelPlacement="end"
                    style={{ marginRight: 8, padding: 8 }}
                  />
                  <Divider />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={globalZoom}
                        onChange={handleGlobalZoomExcludeSwitch}
                      />
                    }
                    label="Global Zoom"
                    labelPlacement="end"
                    style={{ marginRight: 8, padding: 8 }}
                  />
                </Menu>
              </>
            )}

            <IconButton onClick={onRemove} size="small">
              <CloseIcon />
            </IconButton>
          </>
        }
      />
      <Divider />
      <CardContent
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="CardContent"
      >
        {isTable ? (
          <ErrorCodesTableComponent
            data={dataSets[0].data}
            errorMap={errorMap}
            onRemove={onRemove}
            left={globalZoom ? globalZoomBounds.left : left}
            right={globalZoom ? globalZoomBounds.right : right}
          />
        ) : isGPS ? (
          <GPSMap
            sensorIds={sensorIds}
            dataSets={dataSets}
            left={left}
            right={right}
            setLeft={setLeft}
            setRight={setRight}
            setZoomed={setZoomed}
            globalZoomBounds={globalZoomBounds}
            setGlobalZoomBounds={setGlobalZoomBounds}
            globalZoom={globalZoom}
            setGlobalZoom={setGlobalZoom}
          />
        ) : (
          <LineChartComponent
            dataSets={dataSets}
            sensorIds={sensorIds}
            colors={colors}
            id_map={id_map}
            left={left}
            right={right}
            setLeft={setLeft}
            setRight={setRight}
            setZoomed={setZoomed}
            min0={min0}
            setGlobalZoomBounds={setGlobalZoomBounds}
            globalZoomBounds={globalZoomBounds}
            globalZoom={globalZoom}
            globalZoomed={globalZoomed}
            setGlobalZoomed={setGlobalZoomed}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default SensorChart;
