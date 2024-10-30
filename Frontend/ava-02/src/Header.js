import React from "react";
import { AppBar, Tabs, Tab, Toolbar, Typography } from "@mui/material";
import { Link, useLocation } from "react-router-dom";

const Header = () => {
  const location = useLocation(); // This will keep track of the current route
  const value = location.pathname;

  return (
    <AppBar
      position="static"
      sx={{ backgroundColor: "#2C3E50", padding: "0 2rem" }}
    >
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          AVA-02
        </Typography>
        <Tabs
          value={value}
          textColor="inherit"
          aria-label="navigation tabs"
          sx={{
            ml: "auto",
            "& .MuiTabs-indicator": { backgroundColor: "red" },
          }}
        >
          <Tab label="Home" component={Link} to="/" value="/" />
          <Tab
            label="Analytics"
            component={Link}
            to="/analytics"
            value="/analytics"
          />
          <Tab
            label="Live Telemetry"
            component={Link}
            to="/live-telemetry"
            value="/live-telemetry"
          />
        </Tabs>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
