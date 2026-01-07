import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/**",
        "**/*.test.ts",
        "**/test-*.ts",
        "eslint.config.js",
        "vitest.config.ts",
      ],
      thresholds: {
        // Updated after foundation hardening (2026-01-06)
        statements: 81,
        branches: 78,
        functions: 88,
        lines: 84,
      },
    },
  },
});
