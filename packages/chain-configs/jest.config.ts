import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  setupFiles: ["./jest.setup.ts"],
  testPathIgnorePatterns: ["<rootDir>/test/chain-configs-rpc-urls.test.ts"],
};

export default config;
