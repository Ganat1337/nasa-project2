import { defineConfig, loadEnv } from "vite";
import { geminiPlugin } from "./server/gemini";
import { doctorPlugin } from "./server/doctor";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    plugins: [
      react(),
      geminiPlugin(env.GEMINI_API_KEY ?? "", env.GEMINI_MODEL || "gemini-3.5-flash-lite"),
      doctorPlugin(env.DOCTOR_ALERT_WEBHOOK_URL ?? "", env.DOCTOR_ALERT_WEBHOOK_TOKEN ?? ""),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.svg"],
        manifest: {
          id: "/",
          name: "AstroPulse | Artemis IV Crew Health Monitor",
          short_name: "AstroPulse",
          description: "Simulated crew health and mission support dashboard.",
          theme_color: "#060913",
          background_color: "#060913",
          display: "standalone",
          start_url: "/",
          icons: [
            {
              src: "/favicon.svg",
              sizes: "any",
              type: "image/svg+xml",
              purpose: "any maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{html,js,css,svg,woff,woff2,ttf,ico,png}"],
          navigateFallback: "index.html",
        },
      }),
    ],
  };
});
