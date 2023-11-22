module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:prettier/recommended",
    "plugin:workspaces/recommended",
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "workspaces"],
  ignorePatterns: ["dist", "*.js"],
  rules: {
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-unnecessary-condition": "error",
    "no-constant-condition": "off",
    "no-unused-expressions": "off",
    "@typescript-eslint/no-unused-expressions": "error",
    "no-return-await": "off",
    "class-methods-use-this": "off",
    "@typescript-eslint/class-methods-use-this": [
      "error",
      {
        ignoreOverrideMethods: true,
      },
    ],
    "@typescript-eslint/return-await": ["error", "always"],
    "workspaces/require-dependency": "off",
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "no-loss-of-precision": "off",
    "@typescript-eslint/no-loss-of-precision": "error",
    "@typescript-eslint/unbound-method": ["error", { ignoreStatic: true }],
    "no-throw-literal": "off",
    "@typescript-eslint/no-throw-literal": "error",
    "prefer-promise-reject-errors": "error"
  },
  root: true,
};
