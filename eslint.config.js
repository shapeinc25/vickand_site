import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["dist/", "legacy/", "design/", "node_modules/"] },
  js.configs.recommended,
  {
    files: ["src/**/*.js"],
    languageOptions: { ecmaVersion: 2022, sourceType: "module", globals: globals.browser },
    rules: {
      "no-unused-vars": ["error", { args: "none" }],
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
  {
    files: ["*.config.js"],
    languageOptions: { sourceType: "module", globals: globals.node },
  },
];
