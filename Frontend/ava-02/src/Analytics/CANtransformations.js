export const transformCANMessagesToTimeSeriesDIGITAL = (canMessages) => {
  return canMessages.map((message) => ({
    timestamp: message.time, // Adjust based on your timestamp format
    value: message.raw_data[0], // Adjust based on your data structure
  }));
};

export const transformCANMessagesToTimeSeriesANALOG = (canMessages) => {
  return canMessages.map((message) => ({
    timestamp: message.time,
    value: message.raw_data[0] * 100 + message.raw_data[1],
  }));
};

export const transformCANMessagesToTimeSeriesTORQUE = (canMessages) => {
  return canMessages.map((message) => ({
    timestamp: message.time,
    value: message.raw_data[1] * 256 + message.raw_data[0],
  }));
};
