import { useState, useRef } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import id_map from "../idMap";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import {
  transforCANMessagesToTimeSeriesHEALTH,
  transformCANMessagesToTimeSeriesACCEL,
  transformCANMessagesToTimeSeriesANALOG,
  transformCANMessagesToTimeSeriesDIGITAL,
  transformCANmessagesToTimeSeriesGPS,
  transformCANMessagesToTimeSeriesHOTBOX,
  transformCANMessagesToTimeSeriesTORQUE,
} from "./CANtransformations";
import CircularProgress from "@mui/material/CircularProgress";

function DriveObject({
  drive,
  handleExpand,
  sensorData,
  loadingSensors,
  cachedData,
  setCachedData,
  setSensorData,
  pendingFetches,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef(null);

  // Format the date to MM:DD:YY HH:MM
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(drive.date));

  const handleDragStart = (event, sensorId) => {
    event.dataTransfer.setData("sensorId", sensorId);
    event.dataTransfer.setData("driveId", drive.drive_id);
  };

  const updateCachedData = (driveId, sensorId, newArray) => {
    setCachedData((prevState) => ({
      ...prevState, // Spread the top-level dictionary (drive_ids)
      [driveId]: {
        ...prevState[driveId], // Spread the sensors for the specified drive_id
        [sensorId]: newArray, // Overwrite the array for the specific sensorId
      },
    }));
  };

  const updateHoverFetch = (driveId, sensorId, fetchStatus) => {
    var handOff = sensorData;

    handOff[driveId][sensorId] = fetchStatus;
    setSensorData(handOff);
  };

  const fetchAdditionalData = async (driveId, sensorId) => {
    if (pendingFetches.current[sensorId]) {
      console.log("Fetch already in progress for sensorId:", sensorId);
      return pendingFetches.current[sensorId]; // Return the existing Promise
    }

    updateHoverFetch(driveId, sensorId, true);

    const fetchPromise = (async () => {
      if (!(sensorId in cachedData[driveId])) {
        const response = await fetch(
          `http://fe.brycewhitworth.com:8000/data/${driveId}/${sensorId}`
        );
        const canMessages = await response.json();
        let timeSeriesData;
        // Process data transformations...
        sensorId = String(sensorId);
        driveId = String(driveId);
        if (sensorId === "0") {
          timeSeriesData = transformCANMessagesToTimeSeriesDIGITAL(canMessages);
        } else if (sensorId === "192") {
          timeSeriesData = transformCANMessagesToTimeSeriesTORQUE(canMessages);
        } else if (
          sensorId === "500" ||
          sensorId === "501" ||
          sensorId === "502"
        ) {
          timeSeriesData = transformCANMessagesToTimeSeriesHOTBOX(canMessages);
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
          timeSeriesData = transformCANMessagesToTimeSeriesANALOG(canMessages);
        }
        updateCachedData(driveId, sensorId, timeSeriesData);
        return timeSeriesData;
      }
      updateHoverFetch(driveId, sensorId, false);
    })();

    pendingFetches.current[sensorId] = fetchPromise;

    try {
      await fetchPromise;
    } finally {
      delete pendingFetches.current[sensorId]; // Clear the fetch from the map
    }
  };

  const handleMouseEnter = (driveId, sensorId) => {
    setIsHovered(true);
    hoverTimeoutRef.current = setTimeout(() => {
      if (isHovered) {
        fetchAdditionalData(driveId, sensorId); // Trigger the async function
      }
    }, 100); // 100ms delay
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    clearTimeout(hoverTimeoutRef.current); // Clear the timeout if the mouse leaves before 500ms
  };

  return (
    <Accordion
      onChange={(event, isExpanded) => handleExpand(drive.drive_id, isExpanded)}
      sx={{ marginBottom: 0 }}
    >
      <AccordionSummary
        expandIcon={<ArrowDropDownIcon />}
        aria-controls="panel2-content"
        id="panel2-header"
      >
        <Typography>
          {formattedDate} - {drive.driver.name}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        {loadingSensors === true ? (
          <Typography>Loading</Typography>
        ) : sensorData[drive.drive_id] &&
          Object.keys(sensorData[drive.drive_id]).length > 0 ? (
          <List>
            {Object.keys(sensorData[drive.drive_id] || {}) // Fallback to an empty object if undefined
              .sort((a, b) => parseInt(a) - parseInt(b)) // Sort by integer values in ascending order
              .map((sensor, index, array) => (
                <div
                  key={sensor}
                  // onMouseEnter={() => handleMouseEnter(drive.drive_id, sensor)}
                  // onMouseLeave={handleMouseLeave}
                >
                  <ListItem
                    draggable
                    onDragStart={(event) => handleDragStart(event, sensor)}
                    sx={{
                      padding: 1,
                      borderRadius: 1,
                      backgroundColor: "background.paper",
                      transition: "background-color 0.3s",
                      "&:hover": {
                        backgroundColor: "rgba(211, 211, 211, 0.5)",
                      },
                    }}
                  >
                    <ListItemText primary={id_map[sensor]} />
                  </ListItem>
                  {index < array.length - 1 && <Divider />}
                </div>
              ))}
          </List>
        ) : (
          <CircularProgress color="inherit" size="20px" />
        )}
      </AccordionDetails>
    </Accordion>
  );
}

export default DriveObject;
