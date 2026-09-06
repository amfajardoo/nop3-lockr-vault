import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@app": fileURLToPath(new URL("./src/app", import.meta.url)),
      "@theme": fileURLToPath(new URL("./src/theme", import.meta.url)),
      "@testing": fileURLToPath(new URL("./src/testing", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
