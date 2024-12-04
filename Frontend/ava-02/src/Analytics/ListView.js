import DriveObject from "./DriveObject";
import Divider from "@mui/material/Divider";
import { Typography } from "@mui/material";
import AddDataModal from "./AddDataModal";
import { Box } from "@mui/material";

function ListView({ driveList, handleExpand, sensorData, loadingSensors }) {
  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden", // Prevent overflow on the outer container
      }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{ padding: 1 }}
      >
        <Typography variant="h4" component="div" sx={{ flexGrow: 1 }}>
          Drives
        </Typography>
        <AddDataModal />
      </Box>
      <Divider />
      <Box
        sx={{
          flexGrow: 1,
          overflow: "auto", // Enable scrolling for this container
          padding: 1,
          minHeight: 0, // Allow the box to shrink below its content size
          maxHeight: "calc(100vh - 145px)",
        }}
      >
        {driveList
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .map((drive) => (
            <DriveObject
              key={drive.drive_id}
              drive={drive}
              handleExpand={handleExpand}
              sensors={sensorData[drive.drive_id] || []}
              loadingSensors={loadingSensors}
            />
          ))}
      </Box>
    </Box>
  );
}

export default ListView;
