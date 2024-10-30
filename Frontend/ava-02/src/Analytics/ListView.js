import DriveObject from "./DriveObject";
import Divider from "@mui/material/Divider";
import { Typography } from "@mui/material";
import AddDataModal from "./AddDataModal";
import { Box } from "@mui/material";
function ListView({ driveList, handleExpand, sensorData, loadingSensors }) {
  return (
    <div>
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
      <br />
      <div style={{ padding: 10 }}>
        {driveList.map((drive) => (
          <DriveObject
            key={drive.drive_id}
            drive={drive}
            handleExpand={handleExpand}
            sensors={sensorData[drive.drive_id] || []}
            loadingSensors={loadingSensors} // Pass the relevant sensor data
          />
        ))}
      </div>
    </div>
  );
}

export default ListView;
