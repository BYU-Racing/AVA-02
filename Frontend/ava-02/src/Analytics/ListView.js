import DriveObject from "./DriveObject";
import Divider from "@mui/material/Divider";
function ListView({ driveList, handleExpand, sensorData, loadingSensors }) {
  return (
    <div>
      <h1>Drives</h1>
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
