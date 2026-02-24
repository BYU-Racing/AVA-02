// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     proxy: {
//       "/api": "http://localhost:8000",
//     },
//   },
// });

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

const ANALYZE = process.env.ANALYZE === "true";

export default defineConfig({
  plugins: [
    react(),
    ...(ANALYZE 
      ? [visualizer({ open: true, filename: "dist/stats.html", gzipSize: true, brotliSize: true })] 
      : []),
  ],
});