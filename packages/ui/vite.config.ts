import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [solid()],
  server: {
    port: 3000,
    open: true,
    headers: {
      "Service-Worker-Allowed": "/",
    },
  },
  build: {
    target: "esnext",
    minify: "terser",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["solid-js"],
        },
      },
    },
  },
});
