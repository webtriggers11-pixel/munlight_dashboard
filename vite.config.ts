import path from "path"
import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  // In dev, the browser calls /api same-origin and Vite forwards to the real
  // backend server-side — this sidesteps the API's CORS allow-list (which does
  // not include localhost). Configurable via VITE_DEV_PROXY_TARGET.
  const proxyTarget =
    env.VITE_DEV_PROXY_TARGET ?? "https://munlightapi-preprod.up.railway.app"

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5174,
      strictPort: true,
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  }
})
