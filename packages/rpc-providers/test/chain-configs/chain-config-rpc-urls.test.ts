import { RedstoneCommon, loggerFactory } from "@redstone-finance/utils";
import chai from "chai";
import { ethers } from "ethers";
import { describe, test } from "mocha";
import { ChainConfigs } from "../../src";

export const RETRY_CONFIG = {
  maxRetries: 3,
  waitBetweenMs: 1000,
  backOff: {
    backOffBase: 2,
  },
  disableLog: true,
};
const logger = loggerFactory("chain-config/rpc-urls");

describe("Validate chain config rpc urls", function () {
  for (const [name, config] of Object.entries(ChainConfigs)) {
    for (const rpcUrl of config.publicRpcUrls) {
      if (rpcUrl.includes("localhost")) {
        continue;
      }

      test(`Test '${name}' rpc url: ${rpcUrl}`, async () => {
        if (process.env.RUN_RPC_URLS_TESTS !== "true") {
          this.ctx.skip();
        }
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
