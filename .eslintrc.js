module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:prettier/recommended",
    "plugin:workspaces/recommended",
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "workspaces", "eslint-plugin-import"],
  // for some reason eslint hangs on "artifacts" directory
  ignorePatterns: [
    "artifacts",
    "typechain-types",
    "dist",
    "*.js",
    "*.mjs",
    "!.jest",
  ],
  settings: {
    "import/resolver": {
      typescript: true,
      node: true,
    },
  },
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
        ignoreClassesThatImplementAnInterface: true,
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
    "prefer-promise-reject-errors": "error",
    "import/no-named-as-default": ["off"],
    "import/no-named-as-default-member": ["off"],
    "import/no-unresolved": [
      "error",
      {
        commonjs: true,
        ignore: ["warp-contracts/lib/types/contract/testing/Testing"],
      },
    ],
    "import/order": ["off"],
    "import/namespace": "off",
  },
  root: true,
};
