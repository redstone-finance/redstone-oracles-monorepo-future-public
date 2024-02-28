import { ChainConfigSchema, ChainConfigs } from "../../src";
import { z } from "zod";
import { test, describe } from "mocha";

describe("Validate chain config schema", () => {
  test("Scheme should be valid", () => {
    z.record(ChainConfigSchema).parse(ChainConfigs);
  });
});
