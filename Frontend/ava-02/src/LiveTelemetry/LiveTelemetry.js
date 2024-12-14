import React, { useState } from 'react';
import { cursorTo } from 'readline';

function SerialReader() {
  const [port, setPort] = useState(null); // To store the selected port
  const [isReading, setIsReading] = useState(false); // Track if reading is in progress
  const [connectionError, setConnectionError] = useState(null); // Track any connection errors
  const [loraMessage, setMessage] = useState(null); // Message received from LoRA

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

      // Continuously read from the serial port
      while (1) {
        // let left = 0;
        let curPosition = 1;
        let messageStart = 0;
        let messageEnd = 0;
        let messageBuf = "";
        console.log("I'm reading");
        const { value, done } = await reader.read();
        
        messageBuf = messageBuf += value;
        console.log(messageBuf);

        while(curPosition < messageBuf.length) {
            if (messageBuf.slice(curPosition - 1, curPosition + 1) === "*&"){
                messageStart = curPosition-1;
            } else if (messageBuf.slice(curPosition - 1, curPosition + 1) === "&*") {
                messageEnd = curPosition;

                if ((messageStart !== 0) && ((messageEnd - messageStart) === 9)) {
                  let newMessage = messageBuf.slice(messageStart, messageEnd + 1)
                  console.log("Recieved New Message: " + newMessage);
                  setMessage(newMessage)
                  messageStart = 0;
                  messageEnd = 0;
                }
            }
            curPosition ++; // processed the message so increment current index

          if (curPosition === messageBuf.length) {
            if (messageStart !== 0) {
              messageBuf = messageBuf.slice(messageStart);
              curPosition = 1;
            }
          }
        }
          // check if buff < 2
          // if message[right-1: 1] === "*&"
              // messageStart = right
          // elif same thing for end of message
              // 
              // if (start != 0 && end-start=expected)
                // newBuf = mesageBuf[start:end]
                  // setMessage(newBuf)
                  // reset start and end to 0
            // if end of messageBuf
              // get rid of everyting before messageStart
          // right + 1

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

      <p>Received Message: {loraMessage}</p>
    </div>

  );
}

export default SerialReader;
