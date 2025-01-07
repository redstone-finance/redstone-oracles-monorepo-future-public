import { isNonEvmAdapterType } from "@redstone-finance/on-chain-relayer-common";
import { RelayerConfig } from "../config/RelayerConfig";
import { getFuelContractConnector } from "./get-fuel-contract-connector";
import { getRadixContractConnector } from "./get-radix-contract-connector";

export async function getNonEvmContractConnector(relayerConfig: RelayerConfig) {
  if (!isNonEvmAdapterType(relayerConfig.adapterContractType)) {
    throw new Error(
      `${relayerConfig.adapterContractType} is not supported for non-evm`
    );
  }

  switch (relayerConfig.adapterContractType) {
    case "fuel":
      return await getFuelContractConnector(relayerConfig);
    case "radix":
      return getRadixContractConnector(relayerConfig);
    case "radix-multi-feed":
      return getRadixContractConnector(relayerConfig, true);
  }
}
