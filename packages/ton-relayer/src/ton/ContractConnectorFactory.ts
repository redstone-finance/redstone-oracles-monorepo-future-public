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

export class ContractConnectorFactory {
  static tonNetwork = new CustomTonNetwork(async () => {
    return await mnemonicToWalletKey(config.walletMnemonic);
  }, config);

  static makePriceManagerContractConnector(): IContractConnector<IPriceManagerContractAdapter> {
    return new PriceManagerRelayerTonContractConnector(
      this.tonNetwork,
      config.priceManagerAddress
    );
  }

  static makePriceFeedContractConnector(
    address: string
  ): IContractConnector<PriceFeedRelayerTonContractAdapter> {
    return new PriceFeedRelayerTonContractConnector(this.tonNetwork, address);
  }
}
