import { getStreamIdForNodeByEvmAddress } from "../src/common/streamr";

describe("Stremr proxy tests", () => {
  test("Should properly get stream id by node evm address", () => {
    const streamId = getStreamIdForNodeByEvmAddress("0x1234");
    expect(streamId).toBe("/redstone-oracle-node/0x1234/data-packages");
  });
});
