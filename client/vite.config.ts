import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react-dom")) return "react";
          if (id.includes("node_modules/react-router")) return "router";
          if (id.includes("node_modules/axios")) return "vendor";
          if (id.includes("node_modules/recharts")) return "charts";
          if (id.includes("node_modules/lucide-react")) return "icons";
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:5000",
        ws: true,
      },
    },
  },
});
