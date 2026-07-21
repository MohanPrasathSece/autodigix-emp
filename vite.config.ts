import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@/components": path.resolve(__dirname, "./src/shared/components"),
      "@/hooks": path.resolve(__dirname, "./src/shared/hooks"),
      "@/lib": path.resolve(__dirname, "./src/shared/lib"),
      "@/layouts": path.resolve(__dirname, "./src/shared/layouts"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
