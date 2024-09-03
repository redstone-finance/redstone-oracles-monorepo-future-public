import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  setupFiles: ["./jest.setup.ts"],
};

export default config;
