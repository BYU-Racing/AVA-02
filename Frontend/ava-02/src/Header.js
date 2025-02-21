import React from "react";
import { AppBar, Tabs, Tab, Toolbar } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import Typography from "@mui/material/Typography";
import "./App.css";

const Header = () => {
  const location = useLocation(); // This will keep track of the current route
  const value = location.pathname;

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: "#121212", // Background color
        padding: "0 2rem", // Horizontal padding
        height: "50px", // Adjust height
        justifyContent: "center", // Align content
      }}
    >
      <Toolbar
        sx={{
          minHeight: "50px", // Ensure the Toolbar matches the AppBar height
          padding: 0, // Remove extra padding
        }}
      >
        <Typography
          variant="h4"
          component="div"
          fontFamily="avaFont"
          sx={{ flexGrow: 1 }}
        >
          {value === "/live-telemetry" ? "AVA-02 LIVE" : "AVA-02"}
        </Typography>
        <Tabs
          value={value}
          textColor="inherit"
          aria-label="navigation tabs"
          sx={{
            ml: "auto", // Push tabs to the right
            "& .MuiTabs-indicator": {
              backgroundColor: "#1d41a3",
              height: "3px",
            },
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
