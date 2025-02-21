import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./Header";
import Home from "./Home";
import Analytics from "./Analytics/Analytics";
import LiveTelemetry from "./LiveTelemetry/LiveTelemetry";
import { useState, useEffect } from "react";
import { LoadScript } from "@react-google-maps/api";

function App() {
  const [driveList, setDriveList] = useState([]);
  const [cachedData, setCachedData] = useState({});

  // Fetch drives on component mount
  const getDrives = async () => {
    async function fetchDrives() {
      const response = await fetch("https://fe.brycewhitworth.com/api/drive");
      const data = await response.json();
      return data;
    }

    const drives = await fetchDrives();

    let cacheStart = {};
    for (let i = 0; i < drives.length; i++) {
      cacheStart[drives[i].drive_id] = {};
    }
    setCachedData(cacheStart);
    setDriveList(drives);
  };

  useEffect(() => {
    if (driveList.length === 0) {
      getDrives();
    }
  }, []);
  return (
    <LoadScript googleMapsApiKey="">
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/analytics"
            element={
              <Analytics
                driveList={driveList}
                setDriveList={setDriveList}
                setCachedData={setCachedData}
                cachedData={cachedData}
              />
            }
          />
          <Route path="/live-telemetry" element={<LiveTelemetry />} />
          <Route
            path="/*"
            element={<p>WAKE UP!! YOU ARE LOST!! WAKE UP!! YOU ARE LOST!!</p>}
          />
        </Routes>
      </Router>
    </LoadScript>
  );
}

export default App;
