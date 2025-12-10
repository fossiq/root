import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  logLevel: "info",
  plugins: [
    solid(),
    visualizer({
      filename: "dist/stats.html",
      template: "treemap",
      gzipSize: true,
    }),
    {
      name: "suppress-web-tree-sitter-warnings",
      apply: "build",
      configResolved(config) {
        const originalWarn = config.logger.warn;
        config.logger.warn = (msg, options) => {
          // Suppress web-tree-sitter Node.js module warnings
          // web-tree-sitter includes Node.js fallbacks that are safe to ignore in browser context
          if (
            msg.includes("fs/promises") &&
            msg.includes("web-tree-sitter") &&
            msg.includes("externalized")
          ) {
            return;
          }
          if (
            msg.includes('Module "module"') &&
            msg.includes("web-tree-sitter") &&
            msg.includes("externalized")
          ) {
            return;
          }
          originalWarn(msg, options);
        };
      },
    },
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
    commonjsOptions: {
      ignoreDynamicRequires: true,
      ignore: ["fs/promises", "module"],
    },
  },
});
