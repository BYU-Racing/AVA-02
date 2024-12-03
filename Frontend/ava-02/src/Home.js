import React from "react";
import "./App.css";
import VideoScroll from "./VideoScroll";
import ScrollingContent from "./ScrollingContent";

function Home() {
  return (
    <div style={{ position: "relative" }}>
      <VideoScroll />
      <ScrollingContent />
    </div>
  );
}

export default Home;
