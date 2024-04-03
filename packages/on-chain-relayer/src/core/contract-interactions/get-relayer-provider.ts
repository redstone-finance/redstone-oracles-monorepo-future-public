import { MegaProviderBuilder } from "@redstone-finance/rpc-providers";
import { providers } from "ethers";
import { config } from "../../config";

let cachedProvider: providers.Provider | undefined;

const electBlock = (blockNumbers: number[]): number =>
  Math.max(...blockNumbers);

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
        electBlockFn: electBlock,
        ignoreAgreementOnInsufficientResponses: true,
        enableRpcCuratedList: false,
      },
      rpcUrls.length > 1
    )
    .build()!;

  return cachedProvider;
};
