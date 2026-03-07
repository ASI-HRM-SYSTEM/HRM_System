import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  // Use relative paths for Tauri bundled apps
  base: './',
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          firebase: ["firebase/app", "firebase/auth", "firebase/firestore"],
          tauri: [
            "@tauri-apps/api/core",
            "@tauri-apps/plugin-dialog",
            "@tauri-apps/plugin-fs",
            "@tauri-apps/plugin-process",
            "@tauri-apps/plugin-shell",
            "@tauri-apps/plugin-updater"
          ],
          charts: ["recharts"],
          qrcode: ["qrcode", "qrcode.react"]
        }
      }
    }
  },
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
});
