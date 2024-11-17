export const transformCANMessagesToTimeSeriesDIGITAL = (canMessages) => {
  return canMessages.map((message) => ({
    timestamp: message.time, // Adjust based on your timestamp format
    value: message.raw_data[0], // Adjust based on your data structure
  }));
};

export const transformCANMessagesToTimeSeriesANALOG = (canMessages) => {
  console.log(canMessages);
  return canMessages.map((message) => ({
    timestamp: message.time,
    value: (message.raw_data[1] << 8) | message.raw_data[0],
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

      // Copy the first 4 bytes of raw_data into the ArrayBuffer
      for (let i = 0; i < 4; i++) {
        view.setUint8(i, message.raw_data[i]);
      }

      // Read the float value as Big-Endian
      let value = view.getFloat32(0, true); // false indicates Big-Endian

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
