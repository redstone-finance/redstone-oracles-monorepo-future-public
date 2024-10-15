import { RelayerConfig } from "../types";
import { getEvmContractFacade } from "./get-evm-contract-facade";

export const getContractFacade = (relayerConfig: RelayerConfig) => {
  /// The usage of the function will be extended by introducting Fuel Facade.
  return getEvmContractFacade(relayerConfig);
};
