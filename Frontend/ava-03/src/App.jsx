import { LoadScript } from "@react-google-maps/api";
import { useEffect, useState } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Analytics from "./Analytics/Analytics";
import Header from "./Header";
import Home from "./Home";
import LiveTelemetry from "./LiveTelemetry/LiveTelemetry";

function App() {
  const [driveList, setDriveList] = useState([]);
  const [cachedData, setCachedData] = useState({});

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/drive", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch drives (${response.status})`);
        }

        return response.json();
      })
      .then((drives) => {
        const cacheStart = {};

        for (let i = 0; i < drives.length; i++) {
          cacheStart[drives[i].drive_id] = {};
        }

        setCachedData(cacheStart);
        setDriveList(drives);
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Failed to fetch drives:", error);
        }
      });

    return () => controller.abort();
  }, []);
  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <Router>
        <Header />
        <div style={{ paddingTop: '50px' }}>
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
        </div>
      </Router>
    </LoadScript>
  );
}

export default App;
