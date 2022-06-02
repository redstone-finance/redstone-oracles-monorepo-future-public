module.exports = {
  roots: ["<rootDir>/"],
  testMatch: ["**/test/**/?(*.)+(test).+(ts)"],
  transform: {
    "^.+\\.(ts|js)$": "ts-jest",
  },
  testEnvironment: "node",
  testRunner: "jest-circus/runner",
  transformIgnorePatterns: ["<rootDir>/node_modules/(?!@assemblyscript/.*)"],
};
