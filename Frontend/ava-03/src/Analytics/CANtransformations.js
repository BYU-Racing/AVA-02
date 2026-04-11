export const transformCANMessagesToTimeSeriesDIGITAL = (canMessages) => {
  return canMessages.map((message) => ({
    timestamp: message.time, // Adjust based on your timestamp format
    value: message.raw_data[0], // Adjust based on your data structure
  }));
};

const decodeInt32LE = (rawData, offset = 0) => {
  const bytes = rawData.slice(offset, offset + 4);
  while (bytes.length < 4) {
    bytes.push(0);
  }

  const view = new DataView(new Uint8Array(bytes).buffer);
  return view.getInt32(0, true);
};

const decodeUint32LE = (rawData, offset = 0) => {
  const bytes = rawData.slice(offset, offset + 4);
  while (bytes.length < 4) {
    bytes.push(0);
  }

  const view = new DataView(new Uint8Array(bytes).buffer);
  return view.getUint32(0, true);
};

const decodeFloat32LE = (rawData, offset = 0) => {
  const bytes = rawData.slice(offset, offset + 4);
  while (bytes.length < 4) {
    bytes.push(0);
  }

  const view = new DataView(new Uint8Array(bytes).buffer);
  return view.getFloat32(0, true);
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

export const transformCANMessagesToTimeSeriesLiveRVC = (canMessages) => {
  return canMessages.map((message) => ({
    timestamp: message.time,
    value: decodeInt32LE(message.raw_data, 1),
  }));
};

export const transformCANMessagesToTimeSeriesLiveTireRPM = (canMessages) => {
  return canMessages.map((message) => ({
    timestamp: message.time,
    value: decodeUint32LE(message.raw_data, 1),
  }));
};

export const transformCANMessagesToTimeSeriesLiveTireTemp = (canMessages) => {
  return canMessages.map((message) => ({
    timestamp: message.time,
    value: ((message.raw_data[6] ?? 0) << 8) | (message.raw_data[5] ?? 0),
  }));
};

export const transformCANmessagesToTimeSeriesGPS = (canMessages) => {
  return canMessages.map((message) => {
    let lat = decodeFloat32LE(message.raw_data, 0);
    let long = decodeFloat32LE(message.raw_data, 4);

    const floatLooksValid =
      Number.isFinite(lat) &&
      Number.isFinite(long) &&
      Math.abs(lat) <= 90 &&
      Math.abs(long) <= 180;

    if (!floatLooksValid) {
      lat = decodeInt32LE(message.raw_data, 0) / 1e7;
      long = decodeInt32LE(message.raw_data, 4) / 1e7;
    }

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
  } else if (sensorId === "4") {
    timeSeriesData = transformCANMessagesToTimeSeriesLiveRVC(canMessages);
  } else if (sensorId === "5") {
    timeSeriesData = transformCANMessagesToTimeSeriesLiveTireRPM(canMessages);
  } else if (sensorId === "6") {
    timeSeriesData = transformCANMessagesToTimeSeriesLiveTireTemp(canMessages);
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
  } else if (sensorId === "10") {
    timeSeriesData = transformCANMessagesToTimeSeriesDIGITAL(canMessages);
  } else {
    timeSeriesData = transformCANMessagesToTimeSeriesANALOG(canMessages);
  }

  return timeSeriesData;
};
