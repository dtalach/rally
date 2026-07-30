import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The `api/` folder runs as Vercel serverless functions in production; in dev
// it's served by `npm run dev:api`, so proxy /api to it.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: `http://localhost:${process.env.API_PORT ?? 3001}`,
        changeOrigin: true,
      },
    },
  },
});
