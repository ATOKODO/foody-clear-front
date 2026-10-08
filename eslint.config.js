// @ts-check
const eslint = require("@eslint/js");
const { defineConfig } = require("eslint/config");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

module.exports = defineConfig([
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      angular.configs.templateRecommended,
      angular.configs.templateAccessibility,
    ],
    rules: {},
  },
  {
    files: ["src/app/ui/overview-metric/overview-metric.ts", "src/app/ui/date-badge/date-badge.ts", "src/app/ui/button/button.ts", "src/app/ui/status-badge/status-badge.ts", "src/app/ui/summary-pill/summary-pill.ts", "src/app/ui/calendar-tag/calendar-tag.ts", "src/app/ui/breakdown-badge/breakdown-badge.ts", "src/app/ui/alert/alert.ts", "src/app/ui/code-panel/code-panel.ts", "src/app/ui/table/table.ts", "src/app/ui/table-cell/table-cell.ts", "src/app/ui/table-scroll/table-scroll.ts", "src/app/ui/empty-state/empty-state.ts", "src/app/ui/disclosure/disclosure.ts", "src/app/ui/disclosure-summary/disclosure-summary.ts"],
    rules: {
      "@angular-eslint/component-selector": ["error", { type: "attribute", prefix: "app", style: "camelCase" }],
    },
  },
]);
