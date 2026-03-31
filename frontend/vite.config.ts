import { defineConfig, loadEnv } from "vite";
import fs from "fs";
import react from "@vitejs/plugin-react-swc";
import basicSsl from "@vitejs/plugin-basic-ssl";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { ServerOptions } from 'https';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  
  // Check for certificate files
  const certPath = path.resolve(__dirname, '.cert/cert.pem');
  const keyPath = path.resolve(__dirname, '.cert/key.pem');
  const hasCerts = fs.existsSync(certPath) && fs.existsSync(keyPath);

  // HTTPS Configuration
  // Priority: VITE_DEV_HTTPS env variable > certificate existence
  const enableHttps = env.VITE_DEV_HTTPS === 'true' || (env.VITE_DEV_HTTPS !== 'false' && hasCerts);
  
  let httpsConfig: boolean | ServerOptions = false;
  
  if (enableHttps) {
    if (hasCerts) {
      // Use mkcert-generated certificates (preferred)
      try {
        httpsConfig = {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        };
        console.log('✓ Using mkcert certificates from .cert/');
      } catch (error) {
        console.error('❌ Failed to read certificates:', error);
        console.log('⚠️  Falling back to basic SSL');
        httpsConfig = true;
      }
    } else {
      // Fallback to basic SSL (self-signed)
      console.log('⚠️  No certificates found in .cert/');
      console.log('💡 Run "npm run setup:https" to generate trusted certificates');
      console.log('⚠️  Using basic self-signed SSL (browser warnings expected)');
      httpsConfig = true;
    }
  }

  // Get API URL from env, default to empty (uses proxy)
  const apiUrl = env.VITE_API_URL || 'http://localhost:5000';
  
  // Determine protocol for URLs
  const port = 8080;
  
  return {
    server: {
      host: "::", // IPv6 + IPv4
      port: port,
      https: httpsConfig,
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
        },
        '/socket.io': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
        '/uploads': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [
      // Only use basicSsl plugin when HTTPS is enabled but no certs exist
      enableHttps && !hasCerts && basicSsl(),
      react(),
      mode === "development" && componentTagger()
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    preview: {
      host: "::",
      port: 8080,
      https: httpsConfig,
    },
  };
});
