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
import { useState } from "react";
import { Button } from "@mui/material";

function LineChartComponent({ dataSets, sensorIds, colors, id_map }) {
  const [left, setLeft] = useState("dataMin");
  const [right, setRight] = useState("dataMax");
  const [refAreaLeft, setRefAreaLeft] = useState("");
  const [refAreaRight, setRefAreaRight] = useState("");
  const [zoomed, setZoomed] = useState(false);

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

    setLeft(newLeft);
    setRight(newRight);
    setRefAreaLeft("");
    setRefAreaRight("");
    setZoomed(true);
  };

  const zoomOut = () => {
    setLeft("dataMin");
    setRight("dataMax");
    setZoomed(false);
  };

  return (
    <div>
      {zoomed && (
        <Button variant="outlined" onClick={zoomOut}>
          Zoom Out
        </Button>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={dataSets[0].data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          onMouseDown={(e) => e && setRefAreaLeft(e.activeLabel)}
          onMouseMove={(e) =>
            refAreaLeft && e && setRefAreaRight(e.activeLabel)
          }
          onMouseUp={zoom}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            allowDataOverflow
            domain={[left, right]}
            type="number"
          />
          <YAxis domain={[0, "dataMax+1"]} />
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
    </div>
  );
}

export default LineChartComponent;
