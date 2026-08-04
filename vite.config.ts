import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Os dados do grafo chegam via `npm run export:graph` no repositório-fonte e
// ficam em public/data/graph.json — servidos estaticamente, sem bundling.
export default defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    port: 5173,
  },
  build: {
    target: "es2020",
    chunkSizeWarningLimit: 4000,
  },
});
