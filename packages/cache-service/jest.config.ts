import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  verbose: true,
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "test",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
  moduleNameMapper: {
    "streamr-client": "<rootDir>/../.jest/streamr-client-stub.js",
  },
  setupFiles: ["<rootDir>/../.jest/set-env-vars.js"],
};

export default config;
