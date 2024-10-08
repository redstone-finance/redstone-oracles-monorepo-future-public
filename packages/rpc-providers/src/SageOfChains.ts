import { Provider } from "@ethersproject/providers";
import { ChainConfig } from "@redstone-finance/chain-configs";
import { loggerFactory, RedstoneCommon } from "@redstone-finance/utils";

type ProviderWithChainConfig = {
  provider: Provider;
  chainConfig: ChainConfig;
};

const logger = loggerFactory("SageOfChains");

export class SageOfChains {
  chainIdToProvider: Partial<Record<number, ProviderWithChainConfig>> = {};

  constructor(private readonly providersWithConfig: ProviderWithChainConfig[]) {
    for (const providerWithConfig of providersWithConfig) {
      this.chainIdToProvider[providerWithConfig.chainConfig.chainId] =
        providerWithConfig;
    }
  }

  getProviderWithConfigByChainId(chainId: number): ProviderWithChainConfig {
    return RedstoneCommon.assertThenReturn(
      this.chainIdToProvider[chainId],
      `SageOfChains don't have information about chainId=${chainId}`
    );
  }

  getProviderByChainId(chainId: number): Provider {
    return this.getProviderWithConfigByChainId(chainId).provider;
  }

  async getBlockNumbersPerChain(
    timeout: number
  ): Promise<Record<number, number>> {
    const chainIdToBlockTuplesResults = await Promise.allSettled(
      this.providersWithConfig.map(async ({ provider, chainConfig }) => [
        chainConfig.chainId,
        await getBlockNumberWithRetries(provider, timeout),
      ])
    );

    const chainIdToBlockTuples = chainIdToBlockTuplesResults
      .map((result, index) => {
        if (result.status === "fulfilled") {
          return result.value;
        }
        logger.log(
          `Failed to fetch blockNumber for chainId=${
            this.providersWithConfig[index].chainConfig.chainId
          } after 2 retries: ${RedstoneCommon.stringifyError(result.reason)}`
        );
        return false;
      })
      .filter((r) => !!r) as [number, number][];

    return Object.fromEntries(chainIdToBlockTuples);
  }
}

const getBlockNumberWithRetries = (
  provider: Provider,
  timeout: number
): Promise<number> =>
  RedstoneCommon.timeout(
    RedstoneCommon.retry({
      waitBetweenMs: 50,
      maxRetries: 2,
      fn: () => provider.getBlockNumber(),
      logger: logger.log,
    })(),
    timeout
  );
