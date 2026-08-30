import { BASE_PATH } from "@/lib/base-path";

export default function manifest() {
  return {
    name: "QuadQR - Create & Scan",
    short_name: "QuadQR",
    description: "Create and scan QuadQR codes.",
    start_url: `${BASE_PATH}/`,
    scope: `${BASE_PATH}/`,
    display: "standalone",
    background_color: "#f5f6f8",
    theme_color: "#f5f6f8",
    orientation: "any",
    icons: [
      { src: `${BASE_PATH}/icons/icon-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `${BASE_PATH}/icons/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `${BASE_PATH}/icons/icon-maskable-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  };
}
