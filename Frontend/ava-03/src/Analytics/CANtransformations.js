export const transformCANMessagesToTimeSeriesDIGITAL = (canMessages) => {
  return canMessages.map((message) => ({
    timestamp: message.time, // Adjust based on your timestamp format
    value: message.raw_data[0], // Adjust based on your data structure
  }));
};

export const transformCANMessagesToTimeSeriesANALOG = (canMessages) => {
  return canMessages.map((message) => ({
    timestamp: message.time,
    value: (message.raw_data[1] << 8) | message.raw_data[0],
  }));
};

export const transforCANMessagesToTimeSeriesHEALTH = (canMessages) => {
  return canMessages.map((message) => ({
    timestamp: message.time,
    value: message.raw_data[0],
  }));
};

export const transformCANMessagesToTimeSeriesTORQUE = (canMessages) => {
  return canMessages.map((message) => ({
    timestamp: message.time,
    value: message.raw_data[1] * 256 + message.raw_data[0],
  }));
};

export const transformCANMessagesToTimeSeriesHOTBOX = (canMessages) => {
  return canMessages.map((message) => ({
    timestamp: message.time,
    value: ((message.raw_data[1] << 8) | message.raw_data[0]) / 100,
  }));
};

export const transformCANMessagesToTimeSeriesACCEL = (canMessages) => {
  return canMessages.map((message) => {
    try {
      // Create a DataView from the first 4 bytes of raw_data
      const buffer = new ArrayBuffer(4);
      const view = new DataView(buffer);

      for (let i = 0; i < 4; i++) {
        view.setUint8(i, message.raw_data[i]);
      }

      let value = view.getFloat32(0, true);

      // Round the value to 4 decimal places
      value = Math.round(value * 10000) / 10000;

      return {
        timestamp: message.time,
        value: value,
      };
    } catch (error) {
      console.error("Failed to unpack float value:", error);
      return {
        timestamp: message.time,
        value: null, // Indicate failure to decode
      };
    }
  });
};

export const transformCANmessagesToTimeSeriesGPS = (canMessages) => {
  return canMessages.map((message) => {
    let buffer = new ArrayBuffer(4);
    let view = new DataView(buffer);

    for (let i = 0; i < 4; i++) {
      view.setUint8(i, message.raw_data[i]);
    }

    let lat = view.getFloat32(0, true);

    buffer = new ArrayBuffer(4);
    view = new DataView(buffer);

    for (let i = 0; i < 4; i++) {
      view.setUint8(i, message.raw_data[i + 4]);
    }

    let long = view.getFloat32(0, true);

    return {
      timestamp: message.time,
      value: { lat: lat, long: long },
    };
  });
};

export const CANtoTimeseries = (canMessages, sensorId) => {
  let timeSeriesData;

  if (sensorId === "0") {
    timeSeriesData = transformCANMessagesToTimeSeriesDIGITAL(canMessages);
  } else if (sensorId === "192") {
    timeSeriesData = transformCANMessagesToTimeSeriesTORQUE(canMessages);
  } else if (sensorId === "500" || sensorId === "501" || sensorId === "502") {
    timeSeriesData = transformCANMessagesToTimeSeriesHOTBOX(canMessages);
  } else if (
    sensorId === "400" ||
    sensorId === "401" ||
    sensorId === "402" ||
    sensorId === "403" ||
    sensorId === "404" ||
    sensorId === "405"
  ) {
    timeSeriesData = transformCANMessagesToTimeSeriesACCEL(canMessages);
  } else if (sensorId === "201" || sensorId === "202") {
    timeSeriesData = transforCANMessagesToTimeSeriesHEALTH(canMessages);
  } else if (sensorId === "9") {
    timeSeriesData = transformCANmessagesToTimeSeriesGPS(canMessages);
  } else {
    timeSeriesData = transformCANMessagesToTimeSeriesANALOG(canMessages);
  }

  return timeSeriesData;
};
