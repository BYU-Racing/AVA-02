import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

const ANALYZE = process.env.ANALYZE === "true";

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    ...(ANALYZE 
      ? [visualizer({ open: true, filename: "dist/stats.html", gzipSize: true, brotliSize: true })] 
      : []),
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});