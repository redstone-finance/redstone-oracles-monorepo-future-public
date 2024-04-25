import { getOracleRegistryState } from "../src";

describe("oracle registry state", () => {
  test("Should properly get oracle registry state", async () => {
    const state = await getOracleRegistryState();
    expect(Object.keys(state.dataServices).length).toBeGreaterThanOrEqual(9);
    expect(state.dataServices).toHaveProperty("redstone-stocks-demo");
  });
});
