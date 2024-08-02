import { loggerFactory, RedstoneCommon } from "@redstone-finance/utils";
import chai from "chai";
import { ethers } from "ethers";
import { describe, test } from "mocha";
import { ChainConfigs } from "../../src";

export const RETRY_CONFIG = {
  maxRetries: 4,
  waitBetweenMs: 1000,
  backOff: {
    backOffBase: 2,
  },
  disableLog: true,
};
const logger = loggerFactory("chain-config/rpc-urls");

if (process.env.IS_CI === "true") {
  describe("Validate chain config rpc urls", function () {
    this.timeout(45_000);
    for (const [name, config] of Object.entries(ChainConfigs)) {
      for (const rpcUrl of config.publicRpcUrls) {
        if (rpcUrl.includes("localhost")) {
          continue;
        }

        test(`Test '${name}' rpc url: ${rpcUrl}`, async () => {
          const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
          const chainId = await RedstoneCommon.retry({
            fn: async () => (await provider.getNetwork()).chainId,
            fnName: "provider.getNetwork()",
            ...RETRY_CONFIG,
            logger: logger.log,
          })();

          chai.expect(chainId, `Wrong chainId`).to.eq(config.chainId);
        });
      }
    }
  });
}
