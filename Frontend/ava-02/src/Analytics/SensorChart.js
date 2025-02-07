import { useState, useEffect } from "react";
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
import { Icon } from "react-materialize";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import {
  transforCANMessagesToTimeSeriesHEALTH,
  transformCANMessagesToTimeSeriesACCEL,
  transformCANMessagesToTimeSeriesANALOG,
  transformCANMessagesToTimeSeriesDIGITAL,
  transformCANmessagesToTimeSeriesGPS,
  transformCANMessagesToTimeSeriesHOTBOX,
  transformCANMessagesToTimeSeriesTORQUE,
} from "./CANtransformations";
import Skeleton from "@mui/material/Skeleton";

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
  setGlobalZoomHistory,
  globalZoomHistory,
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
  const [zoomHistory, setZoomHistory] = useState([]);

  const [globalZoom, setGlobalZoom] = useState(true);

  const [newDataSets, setNewDataSets] = useState([]);

  const [loadingData, setLoadingData] = useState(true);

  const handleGlobalZoomExcludeSwitch = (event) => {
    setGlobalZoom(event.target.checked);
    if (event.target.checked) {
      setZoomHistory(globalZoomHistory);
    }
  };

  const handleZoomHistoryUpdate = (zoomObject) => {
    if (globalZoom) {
      setGlobalZoomHistory((prevGlobalZoomHistory) => [
        ...prevGlobalZoomHistory,
        zoomObject,
      ]);
    } else {
      setZoomHistory((prevZoomHistory) => [
        ...prevZoomHistory,
        { left: left, right: right },
      ]);
    }
  };

  useEffect(() => {
    if (globalZoom) {
      setZoomHistory(globalZoomHistory);
    }
  }, [globalZoomHistory]);

  useEffect(() => {
    console.log("left", left, "right", right);
    handleZoomQuery(left, right);
  }, [left, right, sensorIds.length]);

  const zoomToPrevious = () => {
    let prevZoom;

    if (globalZoom) {
      prevZoom = globalZoomHistory.at(globalZoomHistory.length - 2);
      setGlobalZoomHistory((prevZoomHistory) => prevZoomHistory.slice(0, -1));
    } else {
      prevZoom = zoomHistory.at(zoomHistory.length - 2);
      setZoomHistory((prevZoomHistory) => prevZoomHistory.slice(0, -1));
    }
    // Handle zoom based on `globalZoom`
    if (globalZoom) {
      setGlobalZoomBounds(prevZoom);
    } else {
      setLeft(prevZoom.left);
      setRight(prevZoom.right);
    }
  };

  useEffect(() => {
    handleZoomQuery(globalZoomBounds.left, globalZoomBounds.right);
  }, []);

  const handleZoomQuery = async (nLeft, nRight) => {
    setLoadingData(true);
    try {
      if (nLeft === "dataMin") {
        nLeft = 0;
      }
      if (nRight === "dataMax") {
        nRight = 10000000000;
      }

      console.log("left: ", nLeft, "right: ", nRight);

      const tempDataSets = await Promise.all(
        sensorIds.map(async ({ driveId, sensorId }) => {
          const response = await fetch(
            `http://fe.brycewhitworth.com:8000/data/${driveId}/${sensorId}/${nLeft}/${nRight}`
          );
          const canMessages = await response.json();
          let timeSeriesData;

          if (sensorId === "0") {
            timeSeriesData =
              transformCANMessagesToTimeSeriesDIGITAL(canMessages);
          } else if (sensorId === "192") {
            timeSeriesData =
              transformCANMessagesToTimeSeriesTORQUE(canMessages);
          } else if (
            sensorId === "500" ||
            sensorId === "501" ||
            sensorId === "502"
          ) {
            timeSeriesData =
              transformCANMessagesToTimeSeriesHOTBOX(canMessages);
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
          } else if (sensorId === "9") {
            timeSeriesData = transformCANmessagesToTimeSeriesGPS(canMessages);
          } else {
            timeSeriesData =
              transformCANMessagesToTimeSeriesANALOG(canMessages);
          }

          setLoadingData(false);

          return { driveId, sensorId, data: timeSeriesData };
        })
      );

      setNewDataSets(tempDataSets);
      console.log("NEW", tempDataSets);
      console.log("OLD", dataSets);
      return tempDataSets;
    } catch (error) {
      console.error("Error in handleZoomQuery:", error);
    }
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

    if (globalZoom) {
      setGlobalZoomHistory([]);
    } else {
      setZoomHistory([]);
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
  const isTable = sensorIds.length === 1 && sensorIds[0].sensorId === "204";
  const isGPS = sensorIds.length === 1 && sensorIds[0].sensorId === "9";

  //NOTES FOR GRABBING THE PENDING FETCHES EVENTUALLY
  // if (sensorId in cachedData[driveId]) {
  //   timeSeriesData = cachedData[driveId][sensorId] || [];
  // } else if (sensorData[driveId][sensorId] === true) {
  //   console.log("Waiting for Hover Fetch");
  //   timeSeriesData = await pendingFetches.current[sensorId];
  //   console.log("Wait success");
  // } else {
  //   const response = await fetch(
  //     `http://fe.brycewhitworth.com:8000/data/${driveId}/${sensorId}`
  //   );

  if (loadingData && newDataSets.length === 0) {
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
              {sensorIds.map((id, id2) => id_map[id.sensorId]).join(", ")}
            </Typography>
          }
          action={
            <>
              <Skeleton variant="rounded" />
            </>
          }
        />
        <Divider />
        <CardContent className="CardContent">
          <Skeleton variant="rounded" height={250} />
        </CardContent>
      </Card>
    );
  }
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
            {sensorIds.map((id, id2) => id_map[id.sensorId]).join(", ")}
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
            {amIZoomed && zoomHistory.length > 1 && (
              <IconButton onClick={zoomToPrevious} size="small">
                <NavigateBeforeIcon />
              </IconButton>
            )}
            {amIZoomed && (
              <IconButton onClick={handleZoomOut} size="small">
                <RestartAltIcon />
              </IconButton>
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
            data={newDataSets[0].data}
            errorMap={errorMap}
            onRemove={onRemove}
            left={globalZoom ? globalZoomBounds.left : left}
            right={globalZoom ? globalZoomBounds.right : right}
          />
        ) : isGPS ? (
          <GPSMap
            sensorIds={sensorIds}
            dataSets={newDataSets}
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
            dataSets={newDataSets}
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
            setZoomHistory={setZoomHistory}
            zoomHistory={zoomHistory}
            handleZoomHistoryUpdate={handleZoomHistoryUpdate}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default SensorChart;
