import { RelayerConfig } from "../config/RelayerConfig";
import { getFuelContractConnector } from "./get-fuel-contract-connector";
import { getRadixContractConnector } from "./get-radix-contract-connector";

export async function getNonEvmContractConnector(relayerConfig: RelayerConfig) {
  switch (relayerConfig.adapterContractType) {
    case "fuel":
      return await getFuelContractConnector(relayerConfig);
    case "radix":
      return getRadixContractConnector(relayerConfig);
    default:
      throw new Error(
        `${relayerConfig.adapterContractType} is not "non-evm" type`
      );
  }
}
