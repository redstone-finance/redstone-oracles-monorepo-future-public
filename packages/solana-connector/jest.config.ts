import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  collectCoverage: true,
  collectCoverageFrom: ["<rootDir>/src/**/*.(t|j)s"],
  coverageDirectory: "<rootDir>/coverage",
  coverageReporters: ["html"],
  preset: "ts-jest",
  transformIgnorePatterns: ["prices-contract-binary.js"],
  testPathIgnorePatterns: ["<rootDir>/dist/"],
};

export default config;
