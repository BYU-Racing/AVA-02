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

  // Fetch drives on component mount
  const getDrives = async () => {
    async function fetchDrives() {
      const response = await fetch("http://127.0.0.1:8000/drive");
      const data = await response.json();
      return data;
    }

    const drives = await fetchDrives();
    setDriveList(drives);
  };

  useEffect(() => {
    if (driveList.length === 0) {
      getDrives();
    }
  }, []);
  return (
    <LoadScript googleMapsApiKey="AIzaSyD9fgXKH7vBQRfI1CP7jWygkY3gOktxmiQ">
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/analytics"
            element={
              <Analytics driveList={driveList} setDriveList={setDriveList} />
            }
          />
          <Route path="/live-telemetry" element={<LiveTelemetry />} />
        </Routes>
      </Router>
    </LoadScript>
  );
}

export default App;
