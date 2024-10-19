import React, { useState } from "react";

function LiveTelemetry() {
  const [port, setPort] = useState(null);
  const [dataById, setDataById] = useState({});
  const [latestMessage, setLatestMessage] = useState("");

  const connectSerial = async () => {
    try {
      const selectedPort = await navigator.serial.requestPort();

      // Open the port with the desired configuration
      await selectedPort.open({ baudRate: 9600 });

      // Set the port in the state
      setPort(selectedPort);

      // Set up a reader to read from the serial port
      const reader = selectedPort.readable.getReader();

      // Continuously read from the port
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          // Allow the serial port to be closed
          reader.releaseLock();
          break;
        }
        // Convert the incoming data
        const decodedData = new TextDecoder().decode(value);
        handleIncomingData(decodedData);
      }
    } catch (err) {
      console.error("Error connecting to serial port: ", err);
    }
  };

  const handleIncomingData = (decodedData) => {
    // Set the latest incoming message for display purposes
    setLatestMessage(decodedData);

    // Parse the data format {ID, [DATA]}
    const regex = /\{(\d+),\[(\d+)\]\}/g;
    let match;

    while ((match = regex.exec(decodedData)) !== null) {
      const id = match[1];
      const data = match[2];

      // Update the state by ID
      setDataById((prevState) => ({
        ...prevState,
        [id]: data,
      }));
    }
  };

  const disconnectSerial = async () => {
    if (port) {
      await port.close();
      setPort(null);
    }
  };

  return (
    <div>
      <h1>Serial Port Reader</h1>
      <button onClick={connectSerial}>Connect to Serial Port</button>
      <button onClick={disconnectSerial} disabled={!port}>
        Disconnect
      </button>
      <div>
        <ul>
          {/* {Object.keys(dataById).map((id) => (
            <li key={id}>
              ID: {id}, Data: {dataById[id]}
            </li>
          ))} */}
        </ul>

        <div>
          <h1 style={{ display: "inline-block", marginRight: "10px" }}>
            Counter Stream -
          </h1>
          <h1 style={{ display: "inline-block" }}>{dataById[1]}</h1>
        </div>

        <div>
          <h1>Switch - </h1>
          {dataById[2] === "0" ? <h1>OFF</h1> : <h1>ON</h1>}
        </div>
      </div>
    </div>
  );
}

export default LiveTelemetry;
