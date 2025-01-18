import React, { useState } from "react";
import Typography from "@mui/material/Typography";
import "../App.css";
import Button from "@mui/material/Button";
import RssFeedIcon from "@mui/icons-material/RssFeed";

function LiveTelemetry() {
  const [port, setPort] = useState(null); // To store the selected port
  const [isReading, setIsReading] = useState(false); // Track if reading is in progress
  const [connectionError, setConnectionError] = useState(null); // Track any connection errors
  const [loraMessage, setMessage] = useState(null); // Message received from LoRA

  const [throttle1Val, setThrottle1Val] = useState(0);

  const handleMessage = (stringMessage) => {
    // Split the string by spaces
    const hexArray = stringMessage.split(" ");

    if (hexArray[0] === "2") {
      // Parse the hex values as integers
      const highByte = parseInt(hexArray[1], 16); // Convert hex string to int
      const lowByte = parseInt(hexArray[2], 16); // Convert hex string to int

      // Combine into a single int16
      let int16Value = (lowByte << 8) | highByte;

      // Set the throttle value

      if (int16Value >= 1024) {
        return hexArray;
      }
      setThrottle1Val(int16Value);
    }

    return hexArray;
  };

  // Function to request a serial port, open it, and read data continuously
  const connectSerial = async () => {
    try {
      console.log("Requesting Serial Port...");

      // Request the user to select a serial port
      const selectedPort = await navigator.serial.requestPort();
      console.log("Selected Port:", selectedPort);

      // Open the serial port with the desired baud rate (e.g., 9600)
      await selectedPort.open({ baudRate: 9600 });
      console.log("Serial Port Opened:", selectedPort);

      // Set the port to the state
      setPort(selectedPort);
      setIsReading(true);

      // Create a reader for the serial port's readable stream
      const reader = selectedPort.readable.getReader();
      console.log("Reader created for port:", selectedPort);

      let messageBuf = ""; // Initialize an empty buffer

      // Continuously read from the serial port
      while (true) {
        let { value, done } = await reader.read();
        if (done) {
          // If the reader is done (port closed), release the lock and break out of the loop
          reader.releaseLock();
          console.log("Serial Port Closed.");
          break;
        }
        // Convert the received value (Uint8Array) to a string and append to the buffer
        messageBuf += new TextDecoder().decode(value);
        //console.log("Raw messageBuf: ", messageBuf);

        // Look for messages within the buffer
        let startIdx = messageBuf.indexOf("*&");
        let endIdx = messageBuf.indexOf("&*");

        // If both start and end markers are found
        while (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
          // Extract the message and update the buffer
          const message = messageBuf.slice(startIdx + 2, endIdx); // Skip "*&" and "&*"
          //console.log("Received Message: ", message);

          // Update the React state with the new message
          setMessage(message);

          handleMessage(message);

          // Remove the processed message from the buffer
          messageBuf = messageBuf.slice(endIdx + 2); // Keep everything after the "&*"

          // Look for the next start and end markers
          startIdx = messageBuf.indexOf("*&");
          endIdx = messageBuf.indexOf("&*");
        }
      }
    } catch (err) {
      console.error("Error connecting to serial port: ", err);
      setConnectionError(err.message || "Unknown Error");
    }
  };

  return (
    <div>
      {connectionError && (
        <p style={{ color: "red" }}>Error: {connectionError}</p>
      )}

      <Button
        variant="contained"
        startIcon={<RssFeedIcon />}
        onClick={connectSerial}
        disabled={isReading}
      >
        Connect AVA-LIVE Module
      </Button>

      <p>Received Message: {loraMessage}</p>
      <h1>Throttle 1: {throttle1Val}</h1>
    </div>
  );
}

export default LiveTelemetry;
