import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: resolve(__dirname),
  server: {
    port: 3031,
    open: true,
  },
  build: {
    outDir: resolve(__dirname, "dist"),
  },
});
