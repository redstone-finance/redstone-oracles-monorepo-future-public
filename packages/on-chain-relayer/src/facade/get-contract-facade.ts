import { DataPackagesResponseCache } from "@redstone-finance/sdk";
import { RelayerConfig } from "../config/RelayerConfig";
import { getFuelContractConnector } from "../non-evm/get-fuel-contract-connector";
import { getEvmContractFacade } from "./get-evm-contract-facade";
import { getIterationArgsProvider } from "./get-iteration-args-provider";
import { NonEvmContractFacade } from "./NonEvmContractFacade";

export const getContractFacade = async (
  relayerConfig: RelayerConfig,
  cache?: DataPackagesResponseCache
) => {
  if (relayerConfig.adapterContractType === "fuel") {
    return new NonEvmContractFacade(
      await getFuelContractConnector(relayerConfig),
      getIterationArgsProvider(relayerConfig),
      cache
    );
  }

  return getEvmContractFacade(relayerConfig, cache);
};
