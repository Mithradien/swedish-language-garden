import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import path from "node:path";

// Standalone SPA build for the Electron desktop app.
// Builds electron-app/ into electron-app/dist with relative asset paths (file:// safe).
export default defineConfig({
  root: path.resolve(__dirname, "../electron-app"),
  base: "./",
  plugins: [tsConfigPaths(), tailwindcss(), react()],
  build: {
    outDir: path.resolve(__dirname, "../electron-app/dist"),
    emptyOutDir: true,
  },
});
