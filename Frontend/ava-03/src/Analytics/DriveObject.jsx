import { useEffect, useState, useRef } from "react";
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
import DownloadIcon from "@mui/icons-material/Download";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Tooltip from "@mui/material/Tooltip";

const HOVER_TIMEOUT = 200;

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
  handleDownload,
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [downloadSubmitting, setDownloadSubmitting] = useState(false);
  const [downloadFeedback, setDownloadFeedback] = useState(null);
  const hoverTimeoutRef = useRef(null);


  // Format the date to MM:DD:YY HH:MM
  const formatDate = (dateStr, timeZone = "America/Denver") => {
    const UTCnormalized = dateStr.trimEnd() + "Z";
    const date = new Date(UTCnormalized);
  
    if (isNaN(date)) {
      console.error("Invalid date value:", date);
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
      }).format(date);
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
      }).format(date);
    }
  }

  const formattedDate = formatDate(drive.date);

  const handleDragStart = (event, sensorId) => {
    event.dataTransfer.setData("sensorId", sensorId);
    event.dataTransfer.setData("driveId", drive.drive_id);
  };

  const updateCachedData = (driveId, sensorId, newArray) => {
    setCachedData((prevState) => ({
      ...prevState,
      [driveId]: {
        ...(prevState[driveId] || {}),
        [sensorId]: newArray, // Overwrite the array for the specific sensorId
      },
    }));
  };

  const updateHoverFetch = (driveId, sensorId, fetchStatus) => {
    setSensorData((prevState) => ({
      ...prevState,
      [driveId]: {
        ...(prevState[driveId] || {}),
        [sensorId]: fetchStatus,
      },
    }));
  };

  const fetchAdditionalData = async (driveId, sensorId) => {
    const fetchKey = `${driveId}:${sensorId}`;
    const normalizedDriveId = String(driveId);
    const normalizedSensorId = String(sensorId);

    if (cachedData[normalizedDriveId]?.[normalizedSensorId]) {
      return cachedData[normalizedDriveId][normalizedSensorId];
    }

    if (pendingFetches.current[fetchKey]) {
      console.log("Fetch already in progress for sensorId:", sensorId);
      return pendingFetches.current[fetchKey];
    }

    updateHoverFetch(driveId, sensorId, true);

    const fetchPromise = (async () => {
      try {
        const response = await fetch(
          `/api/data/${driveId}/${sensorId}`
        );
        const canMessages = await response.json();
        const timeSeriesData = CANtoTimeseries(canMessages, normalizedSensorId);

        updateCachedData(normalizedDriveId, normalizedSensorId, timeSeriesData);
        return timeSeriesData;
      } finally {
        updateHoverFetch(driveId, sensorId, false);
      }
    })();

    pendingFetches.current[fetchKey] = fetchPromise;

    try {
      return await fetchPromise;
    } finally {
      delete pendingFetches.current[fetchKey];
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setDeletePassword("");
    setDeleteError("");
    setConfirmOpen(true);
  };

  const handleDeleteClose = () => {
    setConfirmOpen(false);
    setDeletePassword("");
    setDeleteError("");
    setDeleteSubmitting(false);
  };

  const handleConfirmDelete = async () => {
    setDeleteSubmitting(true);
    setDeleteError("");

    try {
      await handleDelete(drive.drive_id, deletePassword);
      handleDeleteClose();
    } catch (error) {
      setDeleteError(error.message || "Failed to delete drive");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleDownloadClick = async (e) => {
    e.stopPropagation();
    setDownloadSubmitting(true);
    setDownloadFeedback(null);

    try {
      await handleDownload(drive.drive_id);
      setDownloadFeedback({
        severity: "success",
        message: `Downloaded CSV for ${drive.driver.name}`,
      });
    } catch (error) {
      setDownloadFeedback({
        severity: "error",
        message: error.message || "Failed to download drive CSV",
      });
    } finally {
      setDownloadSubmitting(false);
    }
  };

  const handleMouseEnter = (driveId, sensorId) => {
    clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      fetchAdditionalData(driveId, sensorId);
    }, HOVER_TIMEOUT);
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimeoutRef.current);
  };

  useEffect(() => {
    return () => clearTimeout(hoverTimeoutRef.current);
  }, []);

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
          <Tooltip title="Download CSV">
            <span>
              <IconButton
                size="small"
                onClick={handleDownloadClick}
                disabled={downloadSubmitting}
              >
                {downloadSubmitting ? (
                  <CircularProgress color="inherit" size="18px" />
                ) : (
                  <DownloadIcon fontSize="small" />
                )}
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Delete drive">
            <IconButton
              size="small"
              onClick={handleDeleteClick}
              sx={{ color: "error.main" }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
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
                      onMouseEnter={() =>
                        handleMouseEnter(drive.drive_id, sensor)
                      }
                      onMouseLeave={handleMouseLeave}
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

      <Dialog open={confirmOpen} onClose={handleDeleteClose}>
        <DialogTitle>Delete Drive?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete the drive from {formattedDate} by {drive.driver.name}? This cannot be undone.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            type="password"
            label="Delete Password"
            value={deletePassword}
            onChange={(event) => setDeletePassword(event.target.value)}
            error={Boolean(deleteError)}
            helperText={deleteError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose} disabled={deleteSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleteSubmitting || deletePassword.trim() === ""}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(downloadFeedback)}
        autoHideDuration={3000}
        onClose={() => setDownloadFeedback(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={downloadFeedback?.severity || "success"}
          onClose={() => setDownloadFeedback(null)}
          sx={{ width: "100%" }}
        >
          {downloadFeedback?.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default DriveObject;
