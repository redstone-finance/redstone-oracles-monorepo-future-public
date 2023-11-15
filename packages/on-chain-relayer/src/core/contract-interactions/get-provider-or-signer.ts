import { MegaProviderBuilder } from "@redstone-finance/rpc-providers";
import { providers } from "ethers";
import { config } from "../../config";

let cachedProvider: providers.Provider | undefined;

export const getProvider = () => {
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
    .fallback({
      singleProviderOperationTimeout: config().singleProviderOperationTimeout,
      allProvidersOperationTimeout: config().allProvidersOperationTimeout,
    })
    .build();

  return cachedProvider;
};
