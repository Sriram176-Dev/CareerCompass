import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/common": path.resolve(__dirname, "./src/components/common"),
      "@/layout": path.resolve(__dirname, "./src/components/layout"),
      "@/features": path.resolve(__dirname, "./src/features"),
      "@/services": path.resolve(__dirname, "./src/services"),
    },
  },
});
