import { DataPackagesResponseCache } from "@redstone-finance/sdk";
import { getFuelContractConnector } from "../non-evm/get-fuel-contract-connector";
import { RelayerConfig } from "../types";
import { getEvmContractFacade } from "./get-evm-contract-facade";
import { NonEvmContractFacade } from "./NonEvmContractFacade";

export const getContractFacade = async (
  relayerConfig: RelayerConfig,
  cache?: DataPackagesResponseCache
) => {
  if (relayerConfig.adapterContractType === "fuel") {
    return new NonEvmContractFacade(
      await getFuelContractConnector(relayerConfig),
      cache
    );
  }

  return getEvmContractFacade(relayerConfig, cache);
};
