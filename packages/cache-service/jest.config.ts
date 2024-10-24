import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  collectCoverage: true,
  collectCoverageFrom: ["<rootDir>/src/**/*.(t|j)s"],
  coverageDirectory: "<rootDir>/coverage",
  coverageReporters: ["html"],
  preset: "ts-jest",
  setupFiles: ["<rootDir>/.jest/set-env-vars.ts"],
  testPathIgnorePatterns: ["<rootDir>/dist/"],
};

export default config;
