const pad2 = (value) => String(value).padStart(2, "0");
const pad3 = (value) => String(value).padStart(3, "0");

const normalizeEpochMs = (timestamp) => {
  const numericTimestamp = Number(timestamp);

  if (!Number.isFinite(numericTimestamp)) {
    return null;
  }

  const absoluteValue = Math.abs(numericTimestamp);

  if (absoluteValue >= 1e12) {
    return numericTimestamp;
  }

  if (absoluteValue >= 1e9) {
    return numericTimestamp * 1000;
  }

  return null;
};

const formatElapsedTimestamp = (timestamp, includeMilliseconds) => {
  const numericTimestamp = Math.max(0, Math.round(Number(timestamp) || 0));
  const hours = Math.floor(numericTimestamp / 3600000);
  const minutes = Math.floor((numericTimestamp % 3600000) / 60000);
  const seconds = Math.floor((numericTimestamp % 60000) / 1000);
  const milliseconds = numericTimestamp % 1000;

  if (hours > 0) {
    return includeMilliseconds
      ? `${hours}:${pad2(minutes)}:${pad2(seconds)}.${pad3(milliseconds)}`
      : `${hours}:${pad2(minutes)}:${pad2(seconds)}`;
  }

  return includeMilliseconds
    ? `${pad2(minutes)}:${pad2(seconds)}.${pad3(milliseconds)}`
    : `${minutes}:${pad2(seconds)}`;
};

export const formatTelemetryTimestamp = (timestamp, { compact = false } = {}) => {
  const epochMs = normalizeEpochMs(timestamp);

  if (epochMs !== null) {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      fractionalSecondDigits: compact ? undefined : 3,
    }).format(new Date(epochMs));
  }

  return formatElapsedTimestamp(timestamp, !compact);
};
