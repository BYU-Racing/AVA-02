import { useState, useRef } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import IconButton from "@mui/material/IconButton";
import id_map from "../idMap";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import { CANtoTimeseries } from "./CANtransformations";
import CircularProgress from "@mui/material/CircularProgress";
// Deleting drives
import DeleteIcon from "@mui/icons-material/Delete";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";

function DriveObject({
  drive,
  handleExpand,
  sensorData,
  loadingSensors,
  cachedData,
  setCachedData,
  setSensorData,
  pendingFetches,
  handleDelete,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const hoverTimeoutRef = useRef(null);


  // Format the date to MM:DD:YY HH:MM
  const formatDate = (dateStr, timeZone = "America/Denver") => {
    const date = new Date(dateStr);
  
    if (isNaN(date)) {
      console.error("Invalid date value:", dateStr);
      return "Invalid date";
    }

    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone,
        month: "2-digit",
        day: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date(dateStr));
    }
    catch (e) {
      console.warn("Input Timezone is invalid", e)
      return new Intl.DateTimeFormat("en-US", {
        timeZone: "UTC",
        month: "2-digit",
        day: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date(dateStr));
    }
  }

  const formattedDate = formatDate(drive.date)

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
          `/api/data/${driveId}/${sensorId}`
        );
        const canMessages = await response.json();
        let timeSeriesData;
        // Process data transformations...
        sensorId = String(sensorId);
        driveId = String(driveId);

        timeSeriesData = CANtoTimeseries(canMessages, sensorId);

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

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    setConfirmOpen(false);
    await handleDelete(drive.drive_id);
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
    <>
      <Accordion
        onChange={(event, isExpanded) => handleExpand(drive.drive_id, isExpanded)}
        sx={{ marginBottom: 0 }}
      >
        <AccordionSummary
          expandIcon={<ArrowDropDownIcon />}
          aria-controls="panel2-content"
          id="panel2-header"
        >
          <Typography sx={{ flexGrow: 1 }}>
            {formattedDate} - {drive.driver.name}
          </Typography>
          <IconButton
            size="small"
            onClick={handleDeleteClick}
            sx={{ color: "error.main" }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </AccordionSummary>
        <AccordionDetails>
          {loadingSensors === true ? (
            <Typography>Loading</Typography>
          ) : sensorData[drive.drive_id] &&
            Object.keys(sensorData[drive.drive_id]).length > 0 ? (
            <List>
              {Object.keys(sensorData[drive.drive_id] || {})
                .sort((a, b) => parseInt(a) - parseInt(b))
                .map((sensor, index, array) => (
                  <div key={sensor}>
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

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Delete Drive?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete the drive from {formattedDate} by {drive.driver.name}? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default DriveObject;