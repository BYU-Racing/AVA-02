// Communication.js
export const handleMessage = (hexArray, setSensorValues) => {
  if (hexArray.length < 3) return; // Ensure valid message

  const sensorType = hexArray[0];
  const highByte = parseInt(hexArray[1], 16);
  const lowByte = parseInt(hexArray[2], 16);
  let int16Value = (lowByte << 8) | highByte;

  if (int16Value >= 1024) {
    return; // Ignore invalid values
  }

  setSensorValues((prevValues) => {
    let updatedValues = { ...prevValues };

    switch (sensorType) {
      case "1":
        updatedValues.throttle1 = int16Value;
        break;
      case "2":
        updatedValues.throttle2 = int16Value;
        break;
      case "3":
        updatedValues.brakePressure = int16Value;
        break;
      default:
        return prevValues; // No update if sensor type is unknown
    }

    return updatedValues;
  });
};


export const connectSerial = async (
    setIsReading, 
    setMessage, 
    setConnectionError, 
    setSensorValues) => {
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
        handleMessage(hexArray, setSensorValues);

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
