import "./App.css";
import VideoScroll from "./VideoScroll";

function Home() {
  return (
    <div style={{ position: "relative" }}>
      <VideoScroll />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          color: "white",
          padding: "20px",
        }}
      >
        <h1 style={{ fontFamily: "avaFont, sans-serif", marginBottom: "20px" }}>
          AVA-02
        </h1>
        <h4>BYU-Racing In-House Analytics Application</h4>
        <div style={{ height: "4000px" }}>
          <p>PLACEHOLDER SCROLL CONTENT</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
