import { useState, useEffect } from "react";
import {
  Alert,
  CircularProgress,
  InputLabel,
  MenuItem,
  FormControl,
  Select,
  Button,
  TextField,
  IconButton,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ClearIcon from "@mui/icons-material/Clear";

function AddDrive() {
  const [driverId, setDriverId] = useState("NULL");
  const [isLoading, setIsLoading] = useState(false);
  const [successful, setSuccessful] = useState(false);
  const [failure, setFailure] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [file, setFile] = useState(null);

  const handleChange = (event) => {
    setDriverId(event.target.value);
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleFileRemove = () => {
    setFile(null);
  };

  useEffect(() => {
    const fetchDrivers = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("http://127.0.0.1:8000/driver");
        if (response.ok) {
          const data = await response.json();
          setDrivers(data);
        } else {
          console.error("Failed to fetch drivers:", response.statusText);
          setFailure(true);
        }
      } catch (error) {
        console.error("Error fetching drivers:", error);
        setFailure(true);
      }
      setIsLoading(false);
    };

    fetchDrivers();
  }, []);

  return (
    <div>
      {failure && <Alert severity="error">Failed to load drivers</Alert>}

      <FormControl fullWidth variant="outlined" margin="normal">
        <InputLabel id="driver-select-label">Driver</InputLabel>
        <Select
          labelId="driver-select-label"
          id="driver-select"
          value={driverId}
          label="Driver"
          onChange={handleChange}
        >
          {drivers.map((driver) => (
            <MenuItem key={driver.driver_id} value={driver.driver_id}>
              {driver.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth margin="normal">
        <input
          accept=".csv, .ava, .txt"
          style={{ display: "none" }}
          id="file-upload"
          type="file"
          onChange={handleFileChange}
        />

        {!file && (
          <label htmlFor="file-upload">
            <Button
              variant="contained"
              color="primary"
              component="span"
              startIcon={<UploadFileIcon />}
            >
              Upload File
            </Button>
          </label>
        )}

        {file && (
          <div
            style={{ display: "flex", alignItems: "center", marginTop: "8px" }}
          >
            <TextField
              variant="outlined"
              fullWidth
              margin="normal"
              value={file.name}
              InputProps={{
                readOnly: true,
              }}
              label="Selected File"
            />
            <IconButton
              onClick={handleFileRemove}
              color="secondary"
              aria-label="remove file"
            >
              <ClearIcon />
            </IconButton>
          </div>
        )}
      </FormControl>
    </div>
  );
}

export default AddDrive;
