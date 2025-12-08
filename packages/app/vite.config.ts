import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solid()],
  optimizeDeps: {
    exclude: ["@fossiq/kql-executor", "@fossiq/kql-language"],
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
