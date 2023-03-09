import { providers } from "ethers";
import { config } from "../../config";

export const getProvider = () => {
  const { rpcUrl, chainName, chainId } = config;

  return new providers.StaticJsonRpcProvider(rpcUrl, {
    name: chainName,
    chainId: Number(chainId),
  });
};
