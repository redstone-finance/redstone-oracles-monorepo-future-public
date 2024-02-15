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
  const { rpcUrls, chainName, chainId, agreementAcceptableBlocksDiff } =
    config();

  const enableAgreementProvider = agreementAcceptableBlocksDiff > 0;

  cachedProvider = new MegaProviderBuilder({
    rpcUrls,
    timeout: config().singleProviderOperationTimeout,
    throttleLimit: 1,
    network: { name: chainName, chainId },
  })
    .fallback(
      {
        singleProviderOperationTimeout: config().singleProviderOperationTimeout,
        allProvidersOperationTimeout: config().allProvidersOperationTimeout,
      },
      !enableAgreementProvider && rpcUrls.length > 1
    )
    .agreement(
      {
        singleProviderOperationTimeout: config().singleProviderOperationTimeout,
        allProvidersOperationTimeout: config().allProvidersOperationTimeout,
        electBlockFn: electBlock,
      },
      enableAgreementProvider && rpcUrls.length > 1
    )
    .build()!;

  return cachedProvider;
};
