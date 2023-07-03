import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  roots: ["<rootDir>/"],
  testMatch: ["**/test/**/?(*.)+(spec).+(ts)"],
  transform: {
    "^.+\\.(ts)$": "ts-jest",
  },
  testEnvironment: "node",
  modulePaths: ["<rootDir>"],
  setupFiles: ["<rootDir>/.jest/set-redstone-number-config.ts"],
  testPathIgnorePatterns: [],
};

export default config;
