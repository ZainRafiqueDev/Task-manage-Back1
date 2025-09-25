
// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import tailwindcss from '@tailwindcss/vite'

// Load .env into process.env
dotenv.config();

export default defineConfig({
  plugins: [react(),tailwindcss()],
  define: {
    // Shim process.env so you can keep using process.env.VITE_API_URL
    "process.env": process.env,
  },
  server: {
    port: 5173, // or whatever you prefer
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
