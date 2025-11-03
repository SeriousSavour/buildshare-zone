import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      // Allow serving files from node_modules
      allow: ['..']
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "/baremux": path.resolve(__dirname, "./node_modules/@mercuryworkshop/bare-mux/dist"),
      "/scram": path.resolve(__dirname, "./node_modules/@mercuryworkshop/scramjet/dist"),
      "/epoxy": path.resolve(__dirname, "./node_modules/@mercuryworkshop/epoxy-transport/dist"),
    },
  },
  optimizeDeps: {
    exclude: ['@mercuryworkshop/scramjet', '@mercuryworkshop/bare-mux', '@mercuryworkshop/epoxy-transport']
  }
}));
