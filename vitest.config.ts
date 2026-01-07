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
        // Current coverage: statements 79%, branches 74%, functions 80%, lines 82%
        // TODO: Increase thresholds as coverage improves
        statements: 79,
        branches: 74,
        functions: 80,
        lines: 80,
      },
    },
  },
});
