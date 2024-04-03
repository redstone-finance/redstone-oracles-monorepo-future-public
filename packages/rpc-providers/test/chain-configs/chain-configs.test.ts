import { describe, test } from "mocha";
import { z } from "zod";
import { ChainConfigSchema, ChainConfigs } from "../../src";

describe("Validate chain config schema", () => {
  test("Scheme should be valid", () => {
    z.record(ChainConfigSchema).parse(ChainConfigs);
  });
});
