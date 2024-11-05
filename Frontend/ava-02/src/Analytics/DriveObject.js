import { useState } from "react";
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

function DriveObject({ drive, handleExpand, sensors, loadingSensors }) {
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
          {drive.driver.name} - {formattedDate}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        {loadingSensors === true ? (
          <Typography>Loading</Typography>
        ) : sensors.length > 0 ? (
          <List>
            {sensors
              .slice() // Create a copy of sensors to avoid modifying the original array
              .sort((a, b) => parseInt(a) - parseInt(b)) // Sort by original integer values in ascending order
              .map((sensor, index) => (
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
                  {index < sensors.length - 1 && <Divider />}
                </div>
              ))}
          </List>
        ) : (
          <Typography>Loading...</Typography>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

export default DriveObject;
