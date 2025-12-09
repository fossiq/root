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
    target: "es2023",
    minify: "terser",
    sourcemap: true,
    rollupOptions: {
      external: ["web-tree-sitter", "tree-sitter", /tree-sitter-.*/],
      output: {
        manualChunks: {
          vendor: ["solid-js"],
        },
      },
    },
  },
});
