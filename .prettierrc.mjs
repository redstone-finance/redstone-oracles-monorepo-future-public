import companyPrettier from "redstone-prettier-config";

export default {
  ...companyPrettier,
  plugins: ["prettier-plugin-organize-imports", "prettier-plugin-solidity"],
};
