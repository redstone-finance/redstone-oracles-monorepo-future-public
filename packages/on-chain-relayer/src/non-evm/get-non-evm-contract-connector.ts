import {
  FUEL,
  isNonEvmAdapterType,
  RADIX,
  RADIX_MULTI_FEED,
  SUI_MULTI_FEED,
} from "@redstone-finance/on-chain-relayer-common";
import { RelayerConfig } from "../config/RelayerConfig";
import { getFuelContractConnector } from "./get-fuel-contract-connector";
import { getRadixContractConnector } from "./get-radix-contract-connector";
import { getSuiContractConnector } from "./get-sui-contract-connector";

export async function getNonEvmContractConnector(relayerConfig: RelayerConfig) {
  if (!isNonEvmAdapterType(relayerConfig.adapterContractType)) {
    throw new Error(
      `${relayerConfig.adapterContractType} is not supported for non-evm`
    );
  }

  switch (relayerConfig.adapterContractType) {
    case FUEL:
      return await getFuelContractConnector(relayerConfig);
    case RADIX:
      return getRadixContractConnector(relayerConfig);
    case RADIX_MULTI_FEED:
      return getRadixContractConnector(relayerConfig, true);
    case SUI_MULTI_FEED:
      return getSuiContractConnector(relayerConfig);
  }
}
