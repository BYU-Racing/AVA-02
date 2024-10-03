import { useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import id_map from "../idMap";

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

  return (
    <Accordion
      onChange={(event, isExpanded) => handleExpand(drive.drive_id, isExpanded)}
    >
      <AccordionSummary
        expandIcon={<ArrowDropDownIcon />}
        aria-controls="panel2-content"
        id="panel2-header"
      >
        <Typography>
          {drive.notes} - {drive.driver.name} - {formattedDate}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        {loadingSensors === true ? (
          <Typography>Loading...</Typography>
        ) : sensors.length > 0 ? (
          <List>
            {sensors.map((sensor, index) => (
              <div key={sensor}>
                <ListItem>
                  <ListItemText primary={id_map[sensor]} />
                </ListItem>
                {/* Add a divider between list items, except for the last one */}
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
