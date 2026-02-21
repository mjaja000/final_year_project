import { defineConfig } from "vite";
import basicSsl from '@vitejs/plugin-basic-ssl';
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Generate or use self-signed cert for HTTPS (required for geolocation on mobile)
const httpsConfig = process.env.VITE_HTTPS === 'true' ? true : false;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    https: httpsConfig, // Enable via VITE_HTTPS=true npm run dev
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false, // Allow proxy to insecure backend
      },
    },
  },
  plugins: [basicSsl(), react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
