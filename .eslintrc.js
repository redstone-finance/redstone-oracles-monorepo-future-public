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
    "@typescript-eslint/unbound-method": ["error", { ignoreStatic: true }],
  },
  root: true,
};
