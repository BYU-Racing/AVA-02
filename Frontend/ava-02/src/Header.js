import React, { useState, useEffect } from "react";
import { AppBar, Tabs, Tab, Toolbar } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import Typography from "@mui/material/Typography";
import "./App.css";

const Header = () => {
  const location = useLocation();
  const value = location.pathname;
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    // Only apply scroll behavior on home page
    if (value !== "/") {
      setVisible(true);
      return;
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 10) {
        // Always show at the top
        setVisible(true);
      } else if (currentScrollY > lastScrollY) {
        // Scrolling down
        setVisible(false);
      } else {
        // Scrolling up
        setVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY, value]);

  return (
    <AppBar
      position="fixed"
      sx={{
        backgroundColor: "#121212",
        padding: "0 2rem",
        height: "50px",
        justifyContent: "center",
        transform: visible ? "translateY(0)" : "translateY(-100%)",
        transition: "transform 0.3s ease-in-out",
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
