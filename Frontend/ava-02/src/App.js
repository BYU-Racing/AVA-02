import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./Header";
import Home from "./Home";
import Analytics from "./Analytics/Analytics";
import LiveTelemetry from "./LiveTelemetry/LiveTelemetry";

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/live-telemetry" element={<LiveTelemetry />} />
      </Routes>
    </Router>
  );
}

export default App;
