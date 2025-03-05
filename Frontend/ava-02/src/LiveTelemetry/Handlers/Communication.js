// Communication.js
export const handleMessage = (hexArray, setThrottle1Val, setThrottle2Val, setBrakeP) => {
  if (hexArray[0] === "2") {
    const highByte = parseInt(hexArray[1], 16);
    const lowByte = parseInt(hexArray[2], 16);
    let int16Value = (lowByte << 8) | highByte;
    if (int16Value >= 1024) {
      return hexArray;
    }
    setThrottle2Val(int16Value);
  }

  if (hexArray[0] === "1") {
    const highByte = parseInt(hexArray[1], 16);
    const lowByte = parseInt(hexArray[2], 16);
    let int16Value = (lowByte << 8) | highByte;
    if (int16Value >= 1024) {
      return hexArray;
    }
    setThrottle1Val(int16Value);
  }

  if (hexArray[0] === "3") {
    const highByte = parseInt(hexArray[1], 16);
    const lowByte = parseInt(hexArray[2], 16);
    let int16Value = (lowByte << 8) | highByte;
    if (int16Value >= 1024) {
      return hexArray;
    }
    setBrakeP(int16Value);
  }

  return hexArray;
};

export const connectSerial = async (setIsReading, setMessage, setConnectionError, setThrottle1Val, setThrottle2Val, setBrakeP) => {
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
        handleMessage(hexArray, setThrottle1Val, setThrottle2Val, setBrakeP);

        messageBuf = messageBuf.slice(endIdx + 2);
        startIdx = messageBuf.indexOf("*&");
        endIdx = messageBuf.indexOf("&*");
      }
    }
  } catch (err) {
    console.error("Error connecting to serial port: ", err);
    setConnectionError(err.message || "Unknown Error");
  }
};
