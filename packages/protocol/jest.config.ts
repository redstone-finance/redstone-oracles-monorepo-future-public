module.exports = {
  roots: ["<rootDir>/"],
  testMatch: ["**/test/**/?(*.)+(test).+(ts)"],
  transform: {
    "^.+\\.(ts|js)$": "ts-jest",
  },
  testEnvironment: "node",
};
