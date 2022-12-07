import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  roots: ["<rootDir>/"],
  testMatch: ["**/test/**/?(*.)+(test).+(ts)"],
  transform: {
    "^.+\\.(ts|js)$": "ts-jest",
  },
  testEnvironment: "node",
  moduleNameMapper: {
    "streamr-client": "<rootDir>/.jest/streamr-client-stub.js",
  },
};

export default config;
