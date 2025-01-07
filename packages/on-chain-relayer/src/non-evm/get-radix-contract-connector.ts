import {
  MultiFeedPriceAdapterRadixContractConnector,
  PriceAdapterRadixContractConnector,
  RadixClient,
} from "@redstone-finance/radix-connector";
import { RelayerConfig } from "../config/RelayerConfig";

export const getRadixContractConnector = (
  relayerConfig: RelayerConfig,
  isMultiFeed: boolean = false
) => {
  const { privateKey, adapterContractAddress, chainId } = relayerConfig;

  const client = new RadixClient(chainId, { ed25519: privateKey });

  return new (
    isMultiFeed
      ? MultiFeedPriceAdapterRadixContractConnector
      : PriceAdapterRadixContractConnector
  )(client, adapterContractAddress);
};
