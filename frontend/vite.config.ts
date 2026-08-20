import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages serves this app from https://<user>.github.io/homeasset/,
// so the production build needs that subpath as its base. Local dev stays at "/".
const GH_PAGES_BASE = "/homeasset/";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === "build" ? GH_PAGES_BASE : "/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "favicon-32x32.png", "apple-touch-icon.png"],
      manifest: {
        name: "HomeAsset — Smart Home Asset & Maintenance Management",
        short_name: "HomeAsset",
        description: "Track houses, rooms, home equipment, and maintenance schedules.",
        theme_color: "#4f46e5",
        background_color: "#f4f5f7",
        display: "standalone",
        orientation: "portrait",
        start_url: ".",
        scope: ".",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Never let the service worker cache /api calls — the app should
        // always talk live to the backend, not a stale cached response.
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: /\/api\//,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
}));
