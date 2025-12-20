import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => ({
  plugins: [react()].filter(Boolean),
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
    ],
  },

  build: {
    outDir: "dist",
    emptyOutDir: true,
    // Image optimization settings
    assetsInlineLimit: 4096, // Inline small assets (< 4KB)
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Never split critical rendering dependencies - keep in main bundle
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/react-router-dom")
          ) {
            return "react-vendor"; // Separate stable chunk for React libraries
          }

          // Keep UI frameworks together
          if (id.includes("@radix-ui") || id.includes("lucide-react")) {
            return "ui-vendor";
          }

          // Optional splitting for large vendor libraries
          if (id.includes("@supabase/supabase-js")) {
            return "supabase";
          }
          if (id.includes("@tanstack/react-query")) {
            return "query";
          }

          // Marketplace-specific code splitting
          if (id.includes("src/pages/marketplace") || id.includes("src/components/marketplace")) {
            return "marketplace";
          }

          // Admin dashboard splitting
          if (id.includes("src/pages/admin") || id.includes("src/components/admin")) {
            return "admin";
          }

          // Chat features splitting
          if (id.includes("src/chat") || id.includes("src/components/chat")) {
            return "chat";
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    // Use esbuild minifier (default) - terser is optional in Vite v3+
    minify: 'esbuild',
    sourcemap: mode !== 'production',
  },
}));
