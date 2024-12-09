module.exports = {
  parserOptions: {
    project: "tsconfig.json",
    tsconfigRootDir: __dirname,
    sourceType: "module",
  },
  ignorePatterns: ["target"],
  overrides: [
    {
      files: "src/**/*.ts",
      rules: {
        "no-console": "error",
      },
    },
  ],
};
