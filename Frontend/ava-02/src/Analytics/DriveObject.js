import { useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

function DriveObject({ drive, handleExpand, sensors }) {
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
        {sensors.length > 0 ? (
          <ul>
            {sensors.map((sensor) => (
              <li key={sensor}>{sensor}</li>
            ))}
          </ul>
        ) : (
          <Typography>No sensors available.</Typography>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

export default DriveObject;
