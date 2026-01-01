import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    ignores: ["**/node_modules/**", "**/dist/**", "**/data/**", "**/*.d.ts"],
  },
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      import: importPlugin,
    },
    settings: {
      "import/parsers": {
        "@typescript-eslint/parser": [".ts"],
      },
      "import/resolver": {
        node: true,
      },
    },
    rules: {
      // Keep the codebase strict and legible.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "no-unused-vars": "off",

      // Enforce module boundaries: don't import other organs' internals.
      // Import from their public API (index.ts) instead.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "../memory/types.js",
              message: "Import from ../memory/index.js (public API) instead.",
            },
            {
              name: "../memory/store.js",
              message: "Import from ../memory/index.js (public API) instead.",
            },
            {
              name: "../regulator/logic.js",
              message:
                "Import from ../regulator/index.js (public API) instead.",
            },
            {
              name: "../regulator/engine.js",
              message:
                "Import from ../regulator/index.js (public API) instead.",
            },
            {
              name: "../regulator/policy.js",
              message:
                "Import from ../regulator/index.js (public API) instead.",
            },
          ],
        },
      ],
    },
  },
];
