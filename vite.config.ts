import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "./",
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      input: { main: "index.html", admin: "admin.html" },
      external: [/@capacitor\//, /@revenuecat\//],
    },
  },
});
