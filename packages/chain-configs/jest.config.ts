import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  collectCoverage: true,
  collectCoverageFrom: ["<rootDir>/src/**/*.(t|j)s"],
  coverageDirectory: "<rootDir>/coverage",
  coverageReporters: ["html"],
  preset: "ts-jest",
  setupFiles: ["./jest.setup.ts"],
  testPathIgnorePatterns: ["<rootDir>/test/chain-configs-rpc-urls.test.ts"],
};

export default config;
