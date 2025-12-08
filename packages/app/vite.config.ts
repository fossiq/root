import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solid()],
  optimizeDeps: {
    exclude: ["@expedition/kql-executor", "@expedition/kql-language"],
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
