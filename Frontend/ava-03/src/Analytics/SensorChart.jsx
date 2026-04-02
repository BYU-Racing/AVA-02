import { useState, useEffect } from "react";
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
import "react-resizable/css/styles.css";
import "./SensorChart.css";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Menu from "@mui/material/Menu";
import TuneIcon from "@mui/icons-material/Tune";
import PublicOffIcon from "@mui/icons-material/PublicOff";
import GPSMap from "./GPSMap";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { CANtoTimeseries } from "./CANtransformations";
import Skeleton from "@mui/material/Skeleton";

function SensorChart({
  chartId,
  sensorIds,
  dataSets,
  cachedData,
  pendingFetches,
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
  const sensorKey = sensorIds
    .map(({ driveId, sensorId }) => `${driveId}:${sensorId}`)
    .join("|");
  const activeLeft = globalZoom ? globalZoomBounds.left : left;
  const activeRight = globalZoom ? globalZoomBounds.right : right;

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
  }, [globalZoom, globalZoomHistory]);

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

  const getPrefetchedSeries = async (driveId, sensorId) => {
    const normalizedDriveId = String(driveId);
    const normalizedSensorId = String(sensorId);
    const fetchKey = `${normalizedDriveId}:${normalizedSensorId}`;

    if (cachedData?.[normalizedDriveId]?.[normalizedSensorId]) {
      return cachedData[normalizedDriveId][normalizedSensorId];
    }

    if (pendingFetches?.current?.[fetchKey]) {
      try {
        return await pendingFetches.current[fetchKey];
      } catch (error) {
        console.error("Pending chart prefetch failed:", error);
      }
    }

    return null;
  };

  const handleZoomQuery = async (nLeft, nRight) => {
    setLoadingData(true);
    try {
      const requestedLeft = nLeft;
      const requestedRight = nRight;
      const isFullRange =
        (requestedLeft === "dataMin" || requestedLeft === 0) &&
        (requestedRight === "dataMax" || requestedRight === -1);

      if (isFullRange && dataSets.every(({ data }) => Array.isArray(data) && data.length > 0)) {
        setNewDataSets(dataSets);
        setLoadingData(false);
        return dataSets;
      }

      if (nLeft === "dataMin") {
        nLeft = 0;
      }
      if (nRight === "dataMax") {
        nRight = -1;
      }

      const tempDataSets = await Promise.all(
        sensorIds.map(async ({ driveId, sensorId }) => {
          if (isFullRange) {
            const prefetchedData = await getPrefetchedSeries(driveId, sensorId);
            if (prefetchedData && prefetchedData.length > 0) {
              return { driveId, sensorId, data: prefetchedData };
            }
          }

          const response = await fetch(
            `/api/data/${driveId}/${sensorId}/${nLeft}/${nRight}`
          );
          if (!response.ok) {
            throw new Error(
              `Failed to fetch chart data for ${driveId}:${sensorId} (${response.status})`
            );
          }
          const canMessages = await response.json();
          const timeSeriesData = CANtoTimeseries(canMessages, sensorId);

          return { driveId, sensorId, data: timeSeriesData };
        })
      );

      setNewDataSets(tempDataSets);
      setLoadingData(false);
      return tempDataSets;
    } catch (error) {
      console.error("Error in handleZoomQuery:", error);
      setLoadingData(false);
    }
  };

  useEffect(() => {
    handleZoomQuery(activeLeft, activeRight);
  }, [activeLeft, activeRight, sensorKey]);

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
  //     `http://127.0.0.1:8000/data/${driveId}/${sensorId}`
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
        onDrop={!isTable && !isGPS ? onDrop : undefined}
        onDragOver={!isTable && !isGPS ? (e) => e.preventDefault() : undefined}
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
