import DataView from "./DataView";
import ListView from "./ListView";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";

function Analytics() {
  return (
    <div>
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={2}>
          <Grid size={2}>
            <ListView />
          </Grid>
          <Grid size={10}>
            <DataView />
          </Grid>
        </Grid>
      </Box>
    </div>
  );
}

export default Analytics;
