import { providers, Wallet } from "ethers";
import { ProviderWithFallback } from "@redstone-finance/rpc-providers";
import { config } from "../../config";

export const getProvider = () => {
  const { rpcUrls, chainName, chainId } = config();
  const rpcs = rpcUrls.map(
    (url) =>
      new providers.JsonRpcProvider(url, {
        name: chainName,
        chainId,
      })
  );

  if (rpcUrls.length === 1) {
    return rpcs[0];
  }

  return new ProviderWithFallback(rpcs);
};

export const getSigner = () => {
  const provider = getProvider();
  const signer = new Wallet(config().privateKey, provider);
  return signer;
};
