import { config } from "../config";
import { PriceManagerRelayerTonContractConnector } from "./PriceManagerRelayerTonContractConnector";
import {
  IContractConnector,
  IPriceManagerContractAdapter,
} from "@redstone-finance/sdk";
import { CustomTonNetwork } from "@redstone-finance/ton-connector";
import { mnemonicToWalletKey } from "ton-crypto";
import { PriceFeedRelayerTonContractConnector } from "./PriceFeedRelayerTonContractConnector";
import { PriceFeedRelayerTonContractAdapter } from "./PriceFeedRelayerTonContractAdapter";
import { manifest } from "../config/manifest";

export class ContractConnectorFactory {
  static tonNetwork = new CustomTonNetwork(
    async () => {
      return await mnemonicToWalletKey(config.walletMnemonic);
    },
    config,
    manifest.workchain
  );

  static makePriceManagerContractConnector(
    adapterAddress: string
  ): IContractConnector<IPriceManagerContractAdapter> {
    return new PriceManagerRelayerTonContractConnector(
      this.tonNetwork,
      adapterAddress
    );
  }

  static makePriceFeedContractConnector(
    address: string
  ): IContractConnector<PriceFeedRelayerTonContractAdapter> {
    return new PriceFeedRelayerTonContractConnector(this.tonNetwork, address);
  }
}
