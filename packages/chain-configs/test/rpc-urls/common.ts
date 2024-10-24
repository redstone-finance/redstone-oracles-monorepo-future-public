import { loggerFactory, RedstoneCommon } from "@redstone-finance/utils";
import chai from "chai";
import { ethers } from "ethers";
import { RpcUrlsPerChain } from "../../scripts/read-ssm-rpc-urls";
import { getChainConfigByChainId, getLocalChainConfigs } from "../../src";

const RETRY_CONFIG: Omit<RedstoneCommon.RetryConfig, "fn"> = {
  maxRetries: 4,
  waitBetweenMs: 1000,
};
const logger = loggerFactory("chain-config/rpc-urls");

export const validateRpcUrls = (rpcUrlsPerChain: RpcUrlsPerChain) => {
  for (const [name, { chainId, rpcUrls }] of Object.entries(rpcUrlsPerChain)) {
    describe(`${name} (${chainId})`, function () {
      for (const rpcUrl of rpcUrls) {
        if (getChainConfigByChainId(getLocalChainConfigs(), chainId).disabled) {
          continue;
        }

        it(`Test '${name}' rpc url: ${rpcUrl}`, async () => {
          const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
          const fetchedChainId = await RedstoneCommon.retry({
            ...RETRY_CONFIG,
            fn: async () => (await provider.getNetwork()).chainId,
            fnName: "provider.getNetwork()",
            logger: logger.log,
          })();

          chai.expect(fetchedChainId, `Wrong chainId`).to.eq(chainId);
        });
      }
    });
  }
};
