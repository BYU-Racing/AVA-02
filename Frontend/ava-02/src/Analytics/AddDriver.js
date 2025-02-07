import { TextField } from "@mui/material";
import Button from "@mui/material/Button";
import { useState } from "react";
import { Alert } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";

function AddDriver() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [userName, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successful, setSuccessful] = useState(false);
  const [failure, setFailure] = useState(false);

  const handleChange = (event) => {
    setName(event.target.value); // Update the name value as user types
  };

  async function PrintSomething() {
    setIsLoading(true);
    setSuccessful(false);
    setFailure(false);

    try {
      const response = await fetch("http://fe.brycewhitworth.com:8000/driver", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: userName }), // Send name in expected format
      });

      if (response.ok) {
        console.log("Submission successful!");
        setSuccessful(true);
      } else {
        console.error("Failed to submit:", response.statusText);
        setFailure(true);
      }
    } catch (error) {
      console.error("Error submitting:", error);
      setFailure(true);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div>
        <CircularProgress color="inherit" />
      </div>
    );
  } else {
    return (
      <div>
        {successful && <Alert severity="success">Added Driver</Alert>}
        {failure && (
          <div>
            <Alert severity="error">Failure Adding Driver</Alert>
            <br />
          </div>
        )}
        <TextField
          required
          id="outlined-basic"
          label="Name"
          variant="outlined"
          value={userName}
          onChange={handleChange} // Corrected onChange handler
          sx={{ margin: 2 }}
        />
        <br />
        <Button variant="contained" disabled="true" onClick={PrintSomething}>
          Submit
        </Button>
      </div>
    );
  }
}

export default AddDriver;
