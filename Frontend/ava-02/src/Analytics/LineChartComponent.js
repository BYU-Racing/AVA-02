import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import { useState, useMemo, useEffect } from "react";
import "./LineChartComponent.css";

function LineChartComponent({
  dataSets,
  sensorIds,
  colors,
  id_map,
  left,
  right,
  setLeft,
  setRight,
  setZoomed,
  min0,
  globalZoomBounds,
  setGlobalZoomBounds,
  globalZoom,
  globalZoomed,
  setGlobalZoomed,
  setZoomHistory,
  zoomHistory,
  handleZoomHistoryUpdate,
}) {
  const [refAreaLeft, setRefAreaLeft] = useState("");
  const [refAreaRight, setRefAreaRight] = useState("");

  // Calculate the minimum value from all datasets
  const minValue = useMemo(
    () =>
      Math.min(
        ...dataSets.flatMap(({ data }) => data.map((point) => point.value))
      ),
    [dataSets]
  );

  useEffect(() => {
    if (globalZoom) {
      setLeft(globalZoomBounds.left);
      setRight(globalZoomBounds.right);
    }
  }, [globalZoomBounds, globalZoom]);

  const zoom = () => {
    if (refAreaLeft === refAreaRight || !refAreaRight) {
      setRefAreaLeft("");
      setRefAreaRight("");
      return;
    }

    let [newLeft, newRight] =
      refAreaLeft > refAreaRight
        ? [refAreaRight, refAreaLeft]
        : [refAreaLeft, refAreaRight];

    if (globalZoom) {
      setGlobalZoomBounds({ left: newLeft, right: newRight });
      setGlobalZoomed(true);
      setZoomed(true);
    } else {
      setLeft(newLeft);
      setRight(newRight);
      setZoomed(true);
    }

    handleZoomHistoryUpdate({ left: newLeft, right: newRight });

    setRefAreaLeft("");
    setRefAreaRight("");
  };

  return (
    <ResponsiveContainer
      className="charts disable-highlight"
      width="100%"
      height="100%"
    >
      <LineChart
        data={dataSets[0].data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel)}
        onMouseMove={(e) => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
        onMouseUp={zoom}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="timestamp"
          allowDataOverflow
          domain={[left, right]}
          type="number"
        />
        <YAxis domain={min0 ? [0, "dataMax+1"] : [minValue, "dataMax+1"]} />
        <Tooltip />
        <Legend />
        {dataSets.map(({ sensorId, data }, index) => (
          <Line
            key={sensorId}
            type="monotone"
            data={data}
            dataKey="value"
            stroke={colors[index % colors.length]}
            name={id_map[sensorId]}
            dot={false}
            isAnimationActive={false}
          />
        ))}
        {refAreaLeft && refAreaRight ? (
          <ReferenceArea
            x1={refAreaLeft}
            x2={refAreaRight}
            strokeOpacity={0.3}
          />
        ) : null}
      </LineChart>
    </ResponsiveContainer>
  );
}

export default LineChartComponent;
