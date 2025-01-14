module.exports = {
  parserOptions: {
    project: "tsconfig.json",
    tsconfigRootDir: __dirname,
    sourceType: "module",
  },
  ignorePatterns: ["target"],
  overrides: [
    {
      files: "{src,test}/**/*.ts",
      rules: {
        "no-console": "error",
      },
    },
    {
      files: ["scripts/**/*.ts"], // Allow console in `scripts`
      rules: {
        "no-console": "off",
      },
    },
  ],
};
