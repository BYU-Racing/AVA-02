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
import LoadingButton from "@mui/lab/LoadingButton";
import CryptoJS from "crypto-js";

function AddDrive() {
  const [driverId, setDriverId] = useState("NULL");
  const [isLoading, setIsLoading] = useState(false);
  const [successful, setSuccessful] = useState(false);
  const [failure, setFailure] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [currError, setCurrError] = useState("");

  const handleChange = (event) => {
    setDriverId(event.target.value);
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleFileRemove = () => {
    setFile(null);
  };

  const handleNotesChange = (event) => {
    setNotes(event.target.value);
  };

  const calculateFileHash = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileData = event.target.result;
        const hash = CryptoJS.SHA256(fileData).toString(CryptoJS.enc.Hex);
        resolve(hash);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    });
  };

  const createDrive = async () => {
    const currentDate = new Date().toISOString();

    setSuccessful(false);
    setIsLoading(true);

    try {
      const fileHash = await calculateFileHash(file);

      console.log("FILE HASH: ", fileHash);
      const response = await fetch("http://fe.brycewhitworth.com:8000/drive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: currentDate,
          notes: notes,
          hash: fileHash,
          driver_id: driverId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setCurrError(errorData.detail || "Failed to create drive");
        throw new Error(errorData.detail || "Failed to create drive");
      }

      const data = await response.json();
      const driveId = data.drive_id; // Extract drive_id from the response

      const formData = new FormData();
      formData.append("file", file);

      const response2 = await fetch(
        `http://fe.brycewhitworth.com:8000/drive/${driveId}`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response2.ok) {
        throw new Error("Failed to complete second request");
      }

      setSuccessful(true);
    } catch (error) {
      console.error("Error in createDrive:", error);
      setFailure(true);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    const fetchDrivers = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          "http://fe.brycewhitworth.com:8000/driver"
        );
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

  // Check if form is valid
  const isFormValid =
    driverId !== "NULL" && file !== null && notes.trim() !== "";

  return (
    <div>
      {failure && <Alert severity="error">Error: {currError}</Alert>}
      {successful && <Alert severity="success">Succesfully added drive</Alert>}

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
          accept=".ava"
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

      <TextField
        label="Notes"
        multiline
        rows={4}
        variant="outlined"
        fullWidth
        margin="normal"
        value={notes}
        onChange={handleNotesChange}
        placeholder="Enter any notes about the drive here..."
      />

      {!isLoading && (
        <Button
          variant="contained"
          color="primary"
          disabled={!isFormValid} // Disable button if form is incomplete
          onClick={createDrive}
        >
          Add Drive
        </Button>
      )}

      {isLoading && (
        <LoadingButton loading variant="outlined">
          Add Drive
        </LoadingButton>
      )}
    </div>
  );
}

export default AddDrive;
