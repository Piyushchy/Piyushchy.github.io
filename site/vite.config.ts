import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Served from https://piyushchy.github.io/ (a user site), so the base is "/".
export default defineConfig({
  base: "/",
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  build: {
    target: "es2022",
    sourcemap: false,
  },
});
