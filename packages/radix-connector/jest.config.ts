import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  collectCoverage: true,
  collectCoverageFrom: ["<rootDir>/src/**/*.(t|j)s"],
  coverageDirectory: "<rootDir>/coverage",
  coverageReporters: ["html"],
  preset: "ts-jest",
  setupFiles: ["./jest.setup.ts"],
  testPathIgnorePatterns: ["<rootDir>/dist/"],
  roots: ["<rootDir>/src/", "<rootDir>/test/"],
};

export default config;
