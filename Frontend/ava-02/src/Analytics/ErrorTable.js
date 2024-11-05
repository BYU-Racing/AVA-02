import { useState } from "react";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import id_map from "../idMap";
import { Button } from "@mui/material";
import errorMap from "../errorMap";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

function ErrorTable(chartId, sensorIds, dataSets, onRemove, onDrop) {
  const valueCounts = dataSets[0].data.reduce((acc, entry) => {
    acc[entry.value] = (acc[entry.value] || 0) + 1;
    return acc;
  }, {});
  return (
    <div style={{ position: "relative", marginBottom: "16px" }}>
      <Typography variant="h6">
        Error Codes:
        <IconButton onClick={onRemove} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Typography>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Error</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Count</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(valueCounts).map(([value, count]) => (
              <TableRow>
                <TableCell>{errorMap[value]}</TableCell>
                <TableCell>{value}</TableCell>
                <TableCell>{count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

export default ErrorTable;
