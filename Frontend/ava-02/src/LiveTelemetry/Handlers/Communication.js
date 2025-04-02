
/**
 * Parse a message from the serial port and return the processed sensor data
 * @param {string[]} hexArray - Array of 9 hex values from the message
 * @param {Function} setMessage - Optional function to set message display value
 * @returns {Object|null} Parsed sensor data object or null if invalid
 */
export const handleMessage = (hexArray, setMessage) => {
  // Ensure we have enough bytes in the message
  if (!hexArray || hexArray.length < 2) {
    console.warn("Message too short:", hexArray);
    return null;
  }

  try {
    // Extract sensor ID from first byte
    const sensorId = parseInt(hexArray[0], 16);
    if (isNaN(sensorId)) {
      console.warn("Invalid sensor ID:", hexArray[0]);
      return null;
    }

    // Extract the data - we know the second byte is always the value
    // for simple sensors, or the first byte of a multi-byte value
    const dataByte1 = parseInt(hexArray[1], 16);
    if (isNaN(dataByte1)) {
      console.warn("Invalid primary data byte:", hexArray[1]);
      return null;
    }

    // We'll collect all non-empty data bytes
    const validDataBytes = hexArray.slice(1).filter(byte => 
      byte && byte.trim() !== "" && byte !== "00"
    );
    
    // Check if we have one byte of data or multiple
    let value;
    const isMultiByte = validDataBytes.length > 1;
    
    if (isMultiByte) {
      // For multi-byte data, use first two bytes as 16-bit value
      const highByte = parseInt(validDataBytes[0], 16);
      const lowByte = parseInt(validDataBytes[1], 16);
      
      if (isNaN(highByte) || isNaN(lowByte)) {
        console.warn("Invalid data bytes for 16-bit value:", validDataBytes.slice(0, 2));
        // Fallback to using just the first byte
        value = dataByte1;
      } else {
        // Combine high and low bytes
        value = (lowByte << 8) | highByte;
        
        // Validate the value (except for certain sensors like startSwitch)
        if (value >= 1024 && sensorId !== 6) {
          console.warn(`Value out of range (${value}) for sensor ID ${sensorId}`);
          // Use just the first byte as fallback
          value = dataByte1;
        }
      }
    } else {
      // If only one valid data byte or all bytes are empty, use it directly
      value = dataByte1;
      
      // Optionally display the value
      if (setMessage && typeof setMessage === 'function') {
        setMessage(value);
      }
    }

    // Check for special sensor types that might need different handling
    if (sensorId === 6) { // startSwitch is boolean
      value = value > 0;
    }

    console.log(`Sensor ID: ${sensorId}, Value: ${value}, Valid bytes: ${validDataBytes.length}`);
    setMessage(value);
    // Return the parsed data
    return {
      sensorId,
      value,
      isMultiByte,
      validBytes: validDataBytes.length,
      rawData: hexArray.slice(1), // Include all data bytes
      timestamp: new Date().getTime()
    };
  } catch (error) {
    console.error("Error parsing message:", error);
    return null;
  }
};

export const connectSerial = async (
    setIsReading, 
    setMessage, 
    setConnectionError, 
    setSensorData) => {
  try {
    console.log("Requesting Serial Port...");
    const selectedPort = await navigator.serial.requestPort();
    console.log("Selected Port:", selectedPort);
    await selectedPort.open({ baudRate: 9600 });
    console.log("Serial Port Opened:", selectedPort);
    setIsReading(true);
    const reader = selectedPort.readable.getReader();
    console.log("Reader created for port:", selectedPort);
    let messageBuf = "";

    while (true) {
      let { value, done } = await reader.read();
      if (done) {
        reader.releaseLock();
        setIsReading(false);
        console.log("Serial Port Closed.");
        break;
      }
      messageBuf += new TextDecoder().decode(value);

      let startIdx = messageBuf.indexOf("*&");
      let endIdx = messageBuf.indexOf("&*");

      while (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        const message = messageBuf.slice(startIdx + 2, endIdx);
        // setMessage(message); // Update the message state
        const hexArray = message.split(" ");
        const Response = handleMessage(hexArray, setMessage);


        // If valid data and callback provided, pass the data to the callback
        if (Response && setSensorData) {
          setSensorData(Response);
          console.log("Sensor Data:", Response);
        }

        messageBuf = messageBuf.slice(endIdx + 2);
        startIdx = messageBuf.indexOf("*&");
        endIdx = messageBuf.indexOf("&*");
      }
    }
  } catch (err) {
    setIsReading(false);
    console.error("Error connecting to serial port: ", err);
    setConnectionError(err.message || "Unknown Error");
  }
};
