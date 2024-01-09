import {
  IContractConnector,
  IPriceManagerContractAdapter,
} from "@redstone-finance/sdk";
import { CustomTonNetwork } from "@redstone-finance/ton-connector";
import { mnemonicToWalletKey } from "@ton/crypto";
import { config } from "../config";
import { manifest } from "../config/manifest";
import { PriceFeedRelayerTonContractAdapter } from "./PriceFeedRelayerTonContractAdapter";
import { PriceFeedRelayerTonContractConnector } from "./PriceFeedRelayerTonContractConnector";
import { PriceManagerRelayerTonContractConnector } from "./PriceManagerRelayerTonContractConnector";

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
