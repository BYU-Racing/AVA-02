

export const handleMessage = (hexArray) => {
  // Ensure valid message (at least sensorId and one data byte)
  if (hexArray.length < 2) {
    console.warn("Message too short:", hexArray);
    return null;
  }

  try {
    // Extract sensor ID
    const sensorId = parseInt(hexArray[0], 16);
    if (isNaN(sensorId)) {
      console.warn("Invalid sensor ID:", hexArray[0]);
      return null;
    }

    // Parse data based on available bytes
    let value;
    if (hexArray.length >= 3) {
      // If we have at least 2 data bytes, interpret as 16-bit value
      const highByte = parseInt(hexArray[1], 16);
      const lowByte = parseInt(hexArray[2], 16);

      if (isNaN(highByte) || isNaN(lowByte)) {
        console.warn("Invalid data bytes:", hexArray.slice(1, 3));
        return null;
      }

      value = (lowByte << 8) | highByte;

      // Validate the value (for numeric sensors)
      if (value >= 1024 && sensorId !== 6) {
        // Skip validation for startSwitch (ID 6)
        console.warn(`Value out of range (${value}) for sensor ID ${sensorId}`);
        return null;
      }
    } else {
      // If only one data byte, use it directly
      value = parseInt(hexArray[1], 16);

      if (isNaN(value)) {
        console.warn("Invalid data byte:", hexArray[1]);
        return null;
      }
    }

    // Return the parsed data
    return {
      sensorId,
      value,
      rawData: hexArray.slice(1), // Include all data bytes
      timestamp: new Date().getTime(),
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
        setMessage(message);
        const hexArray = message.split(" ");
        const sensorData = handleMessage(hexArray);

        // If valid data and callback provided, pass the data to the callback
        if (sensorData && setSensorData) {
          setSensorData(sensorData);
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
