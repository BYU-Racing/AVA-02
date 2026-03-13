import { useRef, useEffect } from "react";

const TICK_TIME_MS = 100;
const DATA_SAVED_DURATION_S = 20;
const MAX_DATA_POINTS = DATA_SAVED_DURATION_S * (1000 / TICK_TIME_MS);

/**
 * Custom hook for managing chart series data with performance optimizations
 * Uses refs for in-place mutations to avoid React re-renders
 * @param {boolean} connected - WebSocket connection status
 * @returns {Object} Chart series refs and update functions
 */
export function useChartSeries(connected) {
  // Canonical chart series (mutated in place for performance)
  const labelsRef = useRef([]);
  const rpmSeriesRef = useRef([]);
  const throttle1SeriesRef = useRef([]);
  const throttle2SeriesRef = useRef([]);
  const brakeSeriesRef = useRef([]);
  const batterySeriesRef = useRef([]);

  // Chart.js instance refs for imperative updates
  const rpmChartRef = useRef(null);
  const throttleBrakeChartRef = useRef(null);
  const batteryChartRef = useRef(null);

  // Latest sample values
  const latestSamplesRef = useRef({
    rpm: null,
    throttle1: null,
    throttle2: null,
    brake: null,
    battery: null,
  });

  // Sequence tracking for change detection
  const sampleSeqRef = useRef(0);
  const lastDrawnSeqRef = useRef(0);

  // Performance counters
  const perfCountersRef = useRef({
    chartTicks: 0,
    chartUpdates: 0,
    ticksWithNewSamples: 0,
  });

  // Update sample value (called from handlers)
  const updateSample = (key, value) => {
    latestSamplesRef.current[key] = value;
    sampleSeqRef.current += 1;
  };

  // Append a data point to a series
  const appendSeriesPoint = (seriesRef, value) => {
    const series = seriesRef.current;
    const lastValue = series.length ? series[series.length - 1] : 0;
    const nextValue = value ?? lastValue;

    if (series.length < MAX_DATA_POINTS) {
      series.push(nextValue);
      return;
    }

    // Use shift/push so Chart.js array listeners track sliding-window updates
    series.shift();
    series.push(nextValue);
  };

  // Append a label (timestamp)
  const appendLabel = () => {
    const labels = labelsRef.current;
    const nextLabel = new Date().toLocaleTimeString();

    if (labels.length < MAX_DATA_POINTS) {
      labels.push(nextLabel);
      return;
    }

    labels.shift();
    labels.push(nextLabel);
  };

  // Sync chart window (trigger Chart.js update)
  const syncChartWindow = (chartRef) => {
    const chart = chartRef.current;
    if (!chart) return false;
    chart.update();
    return true;
  };

  // Chart tick interval - updates all charts
  useEffect(() => {
    if (!connected) return undefined;

    const interval = setInterval(() => {
      const counters = perfCountersRef.current;
      counters.chartTicks += 1;

      const hasNewSample = sampleSeqRef.current !== lastDrawnSeqRef.current;
      if (!hasNewSample) return;

      counters.ticksWithNewSamples += 1;
      lastDrawnSeqRef.current = sampleSeqRef.current;

      appendLabel();

      const latest = latestSamplesRef.current;
      appendSeriesPoint(rpmSeriesRef, latest.rpm);
      appendSeriesPoint(throttle1SeriesRef, latest.throttle1);
      appendSeriesPoint(throttle2SeriesRef, latest.throttle2);
      appendSeriesPoint(brakeSeriesRef, latest.brake);
      appendSeriesPoint(batterySeriesRef, latest.battery);

      let updates = 0;
      if (syncChartWindow(rpmChartRef)) updates += 1;
      if (syncChartWindow(throttleBrakeChartRef)) updates += 1;
      if (syncChartWindow(batteryChartRef)) updates += 1;
      counters.chartUpdates += updates;
    }, TICK_TIME_MS);

    return () => clearInterval(interval);
  }, [connected]);

  return {
    // Series data refs
    series: {
      labels: labelsRef,
      rpm: rpmSeriesRef,
      throttle1: throttle1SeriesRef,
      throttle2: throttle2SeriesRef,
      brake: brakeSeriesRef,
      battery: batterySeriesRef,
    },
    // Chart instance refs
    chartRefs: {
      rpm: rpmChartRef,
      throttleBrake: throttleBrakeChartRef,
      battery: batteryChartRef,
    },
    // Functions
    updateSample,
    perfCounters: perfCountersRef.current,
  };
}
