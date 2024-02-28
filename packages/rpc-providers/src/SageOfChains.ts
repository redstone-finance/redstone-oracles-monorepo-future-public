import { Provider } from "@ethersproject/providers";
import { RedstoneCommon } from "@redstone-finance/utils";
import { ChainConfig } from "./chains-configs";

type ProviderWithChainCoinfg = { provider: Provider; chainConfig: ChainConfig };

export class SageOfChains {
  chainIdToProvider: Partial<Record<number, ProviderWithChainCoinfg>> = {};

  constructor(private readonly providersWithConfig: ProviderWithChainCoinfg[]) {
    for (const providerWithConfig of providersWithConfig) {
      this.chainIdToProvider[providerWithConfig.chainConfig.chainId] =
        providerWithConfig;
    }
  }

  getProviderWithConfigByChainId(chainId: number): ProviderWithChainCoinfg {
    return RedstoneCommon.assertThenReturn(
      this.chainIdToProvider[chainId],
      `SageOfChains don't have information about chainId=${chainId}`
    );
  }

  getProviderByChainId(chainId: number): Provider {
    return this.getProviderWithConfigByChainId(chainId).provider;
  }

  async getBlockNumbersPerChain(): Promise<Record<number, number>> {
    const chainIdToBlockTuplesResults = await Promise.allSettled(
      this.providersWithConfig.map(async ({ provider, chainConfig }) => [
        chainConfig.chainId,
        await getBlockNumberWithRetries(provider),
      ])
    );

    const chainIdToBlockTuples = chainIdToBlockTuplesResults
      .map((result, index) => {
        if (result.status === "fulfilled") {
          console.log(
            `[SageOfChains] fetched blockNumber=${result.value[1]} for chainId=${result.value[0]}`
          );
          return result.value;
        }
        console.log(
          `[SageOfChains] failed to fetch blockNumber for chainId=${
            this.providersWithConfig[index].chainConfig.chainId
          } after 5 retries: ${RedstoneCommon.stringifyError(result.reason)}`
        );
        return false;
      })
      .filter((r) => !!r) as [number, number][];

    return RedstoneCommon.toSafeRecord(
      Object.fromEntries(chainIdToBlockTuples),
      (p) =>
        new Error(
          `[SageOfChains] Tried to access blockNumber for chainId=${p} which is not defined. Either it wasn't fetched at the beginning of iteration or it is not configured.`
        )
    );
  }
}

const getBlockNumberWithRetries = (provider: Provider): Promise<number> =>
  RedstoneCommon.retry({
    waitBetweenMs: 50,
    maxRetries: 5,
    disableLog: true,
    fn: () => provider.getBlockNumber(),
  })();
