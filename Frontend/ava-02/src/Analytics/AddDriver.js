import { TextField } from "@mui/material";
import Button from "@mui/material/Button";
import { useState } from "react";

function AddDriver() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  function PrintSomething() {
    console.log("BUTTON");
    setIsSubmitted(!isSubmitted);
  }

  if (isSubmitted) {
    return (
      <div>
        <p>Submitted</p>
        <Button onClick={PrintSomething}>Reset</Button>
      </div>
    );
  } else {
    return (
      <div>
        <TextField
          required
          id="outlined-basic"
          label="Name"
          variant="outlined"
        />
        <br />
        <Button onClick={PrintSomething}>Submit</Button>
      </div>
    );
  }
}

export default AddDriver;
