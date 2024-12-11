import React, { useState } from 'react';

function SerialReader() {
  const [port, setPort] = useState(null); // To store the selected port
  const [isReading, setIsReading] = useState(false); // Track if reading is in progress
  const [connectionError, setConnectionError] = useState(null); // Track any connection errors

  // Function to request a serial port, open it, and read data continuously
  const connectSerial = async () => {
    try {
      console.log('Requesting Serial Port...');
      
      // Request the user to select a serial port
      const selectedPort = await navigator.serial.requestPort();
      console.log('Selected Port:', selectedPort);

      // Open the serial port with the desired baud rate (e.g., 9600)
      await selectedPort.open({ baudRate: 9600 });
      console.log('Serial Port Opened:', selectedPort);
      
      // Set the port to the state
      setPort(selectedPort);
      setIsReading(true);
      
      // Create a reader for the serial port's readable stream
      const reader = selectedPort.readable.getReader();
      console.log('Reader created for port:', selectedPort);
      console.log(isReading);

      let messageBuf = [];
      // Continuously read from the serial port
      while (1) {
        console.log("I'm reading");
        const { value, done } = await reader.read();

        
        messageBuf = messageBuf.concat(Array.from(value));
        console.log(messageBuf);

        if (done) {
          // If the reader is done (port closed), release the lock and break out of the loop
          reader.releaseLock();
          console.log('Serial Port Closed.');
          break;
        }
        
        // Log the raw byte array data (value)
        console.log('Raw Data (bytes): ', messageBuf);

        // Check if we received any data
        if (messageBuf && messageBuf.length > 0) {
          // If we received data, attempt to decode it as text (if possible)
           // Convert the plain array to a Uint8Array
          const uint8message = new Uint8Array(messageBuf);  // This creates a typed array
          const buffer = uint8message.buffer;  // Turn to ArrayBuffer for decoding

          const decodedData = new TextDecoder().decode(buffer);
          console.log('Decoded Data: ', decodedData);
        } else {
          console.log('No data received.');
        }
      }
    } catch (err) {
      console.error('Error connecting to serial port: ', err);
      setConnectionError(err.message || 'Unknown Error');
    }
  };

  // Function to disconnect from the serial port
  const disconnectSerial = async () => {
    if (port) {
      await port.close();
      setPort(null);
      setIsReading(false);
      console.log('Disconnected from Serial Port.');
    }
  };

  return (
    <div>
      <h1>Serial Port Reader</h1>
      
      {connectionError && <p style={{ color: 'red' }}>Error: {connectionError}</p>}
      
      <button onClick={connectSerial} disabled={isReading}>
        Connect to Serial Port
      </button>
      <button onClick={disconnectSerial} disabled={!port}>
        Disconnect from Serial Port
      </button>
    </div>
  );
}

export default SerialReader;
