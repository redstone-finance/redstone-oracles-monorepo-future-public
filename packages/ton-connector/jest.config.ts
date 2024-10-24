import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  collectCoverage: true,
  collectCoverageFrom: ["<rootDir>/src/**/*.(t|j)s"],
  coverageDirectory: "<rootDir>/coverage",
  coverageReporters: ["html"],
  preset: "ts-jest",
  setupFilesAfterEnv: ["./jest.setup-after-env.js"],
  testPathIgnorePatterns: ["<rootDir>/dist/"],
};

export default config;
