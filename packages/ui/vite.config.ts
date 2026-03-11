import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import fs from "fs";

export default defineConfig({
  plugins: [
    solid(),
    visualizer({
      filename: "dist/stats.html",
      template: "treemap",
      gzipSize: true,
    }),
    {
      name: "service-worker-version",
      writeBundle() {
        // Generate version from timestamp
        const version = Date.now().toString();

        // Read service worker file
        const swPath = path.resolve(__dirname, "public/sw.js");
        let swContent = fs.readFileSync(swPath, "utf-8");

        // Replace version placeholder
        swContent = swContent.replace("{{VERSION}}", version);

        // Write to dist directory
        const distSwPath = path.resolve(__dirname, "dist/sw.js");
        fs.writeFileSync(distSwPath, swContent, "utf-8");

        console.log(`[SW] Injected version ${version} into service worker`);
      },
    },
  ],
  resolve: {
    alias: {
      "@fossiq/kql-to-duckdb": path.resolve(
        __dirname,
        "../kql-to-duckdb/src/index.ts"
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
    exclude: ["@fossiq/kql-lezer", "@fossiq/kql-to-duckdb"],
  },
  build: {
    target: "es2023",
    minify: "terser",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["solid-js"],
        },
      },
    },
  },
});
