import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Must bind 0.0.0.0 inside the container or HMR can't reach the browser.
    host: "0.0.0.0",
    port: 5173,
    // Needed for HMR over a bind-mount on some Docker/WSL2 setups.
    watch: { usePolling: true },
  },
});
