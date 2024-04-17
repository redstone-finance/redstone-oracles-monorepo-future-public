module.exports = {
  parserOptions: {
    project: "tsconfig.json",
    tsconfigRootDir: __dirname,
    sourceType: "module",
  },
  overrides: [
    {
      files: "*.test.ts",
      rules: {
        // allow for chai assertions like expect(v).to.be.true;
        "@typescript-eslint/no-unused-expressions": "off",
      },
    },
  ],
};
