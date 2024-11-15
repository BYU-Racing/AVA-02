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
import MenuItem from "@mui/material/MenuItem";
import TuneIcon from "@mui/icons-material/Tune";

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
  const [zoomed, setZoomed] = useState(false);
  const [left, setLeft] = useState("dataMin");
  const [right, setRight] = useState("dataMax");
  const [min0, setMin0] = useState(true);

  const [globalZoom, setGlobalZoom] = useState(true);
  const handleGlobalZoomExcludeSwitch = (event) => {
    setGlobalZoom(event.target.checked);
  };

  const handleZoomOut = () => {
    setLeft("dataMin");
    setRight("dataMax");
    setZoomed(false);
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
        title={
          <Typography variant="h6">
            {sensorIds.map((id) => id_map[id]).join(", ")}
          </Typography>
        }
        action={
          <>
            {zoomed && (
              <Button
                variant="outlined"
                onClick={handleZoomOut}
                size="small"
                style={{ marginRight: 8 }}
              >
                Zoom Out
              </Button>
            )}
            <IconButton
              aria-label="delete"
              aria-controls={open ? "basic-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={open ? "true" : undefined}
              onClick={handleOpen}
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
              <MenuItem>
                <FormControlLabel
                  control={<Switch checked={min0} onChange={handleSwitch} />}
                  label="Min 0"
                  labelPlacement="end"
                  style={{ marginRight: 8 }}
                />
              </MenuItem>
              <MenuItem>
                <FormControlLabel
                  control={
                    <Switch
                      checked={globalZoom}
                      onChange={handleGlobalZoomExcludeSwitch}
                    />
                  }
                  label="Global Zoom"
                  labelPlacement="end"
                  style={{ marginRight: 8 }}
                />
              </MenuItem>
            </Menu>

            <IconButton onClick={onRemove} size="small">
              <CloseIcon fontSize="small" />
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
            left={left}
            right={right}
            setLeft={setLeft}
            setRight={setRight}
            setZoomed={setZoomed}
            min0={min0}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default SensorChart;
