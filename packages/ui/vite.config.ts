import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    solid(),
    visualizer({
      filename: "dist/stats.html",
      template: "treemap",
      gzipSize: true,
    }),
  ],
  resolve: {
    alias: {
      "@fossiq/kql-to-duckdb": path.resolve(
        __dirname,
        "../kql-to-duckdb/src/index.ts"
      ),
      "@fossiq/kql-parser": path.resolve(
        __dirname,
        "../kql-parser/src/index.ts"
      ),
    },
  },
  server: {
    port: 3000,
    open: true,
    headers: {
      "Service-Worker-Allowed": "/",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  optimizeDeps: {
    exclude: [
      "@fossiq/kql-lezer",
      "@fossiq/kql-parser",
      "@fossiq/kql-to-duckdb",
    ],
    include: ["web-tree-sitter"],
  },
  build: {
    target: "es2023",
    minify: "terser",
    sourcemap: true,
    rollupOptions: {
      external: ["tree-sitter", /tree-sitter-.*/],
      output: {
        manualChunks: {
          vendor: ["solid-js"],
        },
      },
    },
  },
});
