import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App"; // or "./App" if your file is App.js
import "./index.css";        // or whatever your main css is

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);