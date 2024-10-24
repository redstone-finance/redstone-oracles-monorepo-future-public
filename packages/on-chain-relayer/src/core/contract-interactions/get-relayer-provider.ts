import {
  getChainConfigByChainId,
  getLocalChainConfigs,
} from "@redstone-finance/chain-configs";
import {
  MegaProviderBuilder,
  ProviderDecorators,
} from "@redstone-finance/rpc-providers";
import { providers } from "ethers";
import { config } from "../../config";

let cachedProvider: providers.Provider | undefined;

const ACCEPTABLE_BLOCK_DIFF_IN_MS = 10_000;
const electBlock = (
  blockNumbers: number[],
  _: number,
  chainId: number
): number => {
  const sortedBlockNumber = [...blockNumbers].sort((a, b) => b - a);
  const firstBlockNumber = sortedBlockNumber.at(-1)!;
  const secondBlockNumber = sortedBlockNumber.at(-2);

  const { avgBlockTimeMs } = getChainConfigByChainId(
    getLocalChainConfigs(),
    chainId
  );
  const acceptableBlockDiff = Math.ceil(
    ACCEPTABLE_BLOCK_DIFF_IN_MS / avgBlockTimeMs
  );

  if (!secondBlockNumber) {
    return firstBlockNumber;
  } else if (firstBlockNumber - secondBlockNumber > acceptableBlockDiff) {
    return firstBlockNumber;
  } else {
    return secondBlockNumber;
  }
};

export const getRelayerProvider = () => {
  if (cachedProvider) {
    return cachedProvider;
  }
  const { rpcUrls, chainName, chainId } = config();

  cachedProvider = new MegaProviderBuilder({
    rpcUrls,
    timeout: config().singleProviderOperationTimeout,
    throttleLimit: 1,
    network: { name: chainName, chainId },
  })
    .agreement(
      {
        singleProviderOperationTimeout: config().singleProviderOperationTimeout,
        allProvidersOperationTimeout: config().allProvidersOperationTimeout,
        getBlockNumberTimeoutMS: config().getBlockNumberTimeout,
        electBlockFn: electBlock,
        ignoreAgreementOnInsufficientResponses: true,
      },
      rpcUrls.length > 1
    )
    .addDecorator(
      (factory) =>
        ProviderDecorators.MulticallDecorator(factory, {
          maxCallsCount: 3,
          autoResolveInterval: 100,
        }),
      config().useMulticallProvider
    )
    .addDecorator(ProviderDecorators.Treat0xAsErrorDecorator)
    .build()!;

  return cachedProvider;
};

export const clearCachedRelayerProvider = () => {
  cachedProvider = undefined;
};
