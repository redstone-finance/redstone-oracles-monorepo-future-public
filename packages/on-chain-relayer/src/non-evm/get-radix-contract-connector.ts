import {
  PriceAdapterRadixContractConnector,
  RadixClient,
} from "@redstone-finance/radix-connector";
import { RelayerConfig } from "../config/RelayerConfig";

export const getRadixContractConnector = (relayerConfig: RelayerConfig) => {
  const { privateKey, adapterContractAddress, chainId } = relayerConfig;

  const client = new RadixClient({ ed25519: privateKey }, chainId);

  return new PriceAdapterRadixContractConnector(client, adapterContractAddress);
};
