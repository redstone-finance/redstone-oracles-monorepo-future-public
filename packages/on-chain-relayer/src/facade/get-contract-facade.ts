import { getFuelContractConnector } from "../non-evm/get-fuel-contract-connector";
import { RelayerConfig } from "../types";
import { getEvmContractFacade } from "./get-evm-contract-facade";
import { NonEvmContractFacade } from "./NonEvmContractFacade";

export const getContractFacade = async (relayerConfig: RelayerConfig) => {
  if (relayerConfig.adapterContractType === "fuel") {
    return new NonEvmContractFacade(await getFuelContractConnector());
  }

  return getEvmContractFacade(relayerConfig);
};
