module.exports = {
  parserOptions: {
    project: "tsconfig.json",
    tsconfigRootDir: __dirname,
    sourceType: "module",
  },
  overrides: [
    {
      files: "src/**/*.ts",
      rules: {
        "no-console": "error",
      },
    },
  ],
};
