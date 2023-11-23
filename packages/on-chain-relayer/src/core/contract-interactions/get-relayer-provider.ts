import { MegaProviderBuilder } from "@redstone-finance/rpc-providers";
import { providers } from "ethers";
import { config } from "../../config";

let cachedProvider: providers.Provider | undefined;

const electBlock = (blockNumbers: number[]): number => {
  blockNumbers.sort((a, b) => a - b);
  if (blockNumbers.length === 1) {
    return blockNumbers[0];
  } else if (
    blockNumbers.at(-1)! - blockNumbers.at(-2)! <=
    config().agreementAcceptableBlocksDiff
  ) {
    return blockNumbers.at(-1)!;
  } else {
    return blockNumbers.at(-2)!;
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
    .enableNextIf(config().agreementAcceptableBlocksDiff <= 0)
    .fallback({
      singleProviderOperationTimeout: config().singleProviderOperationTimeout,
      allProvidersOperationTimeout: config().allProvidersOperationTimeout,
    })
    .enableNextIf(config().agreementAcceptableBlocksDiff > 0)
    .agreement({
      singleProviderOperationTimeout: config().singleProviderOperationTimeout,
      allProvidersOperationTimeout: config().allProvidersOperationTimeout,
      electBlockFn: electBlock,
    })
    .build();

  return cachedProvider;
};
