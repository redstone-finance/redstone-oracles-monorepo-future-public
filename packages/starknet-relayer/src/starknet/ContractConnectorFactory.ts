import {
  IContractConnector,
  IPriceFeedContractAdapter,
  IPriceManagerContractAdapter,
} from "@redstone-finance/sdk";
import { config } from "../config";
import { PriceFeedContractConnector } from "./cairo0/PriceFeedContractConnector";
import { PriceManagerContractConnector } from "./cairo0/PriceManagerContractConnector";

export class ContractConnectorFactory {
  static makePriceManagerContractConnector(): IContractConnector<IPriceManagerContractAdapter> {
    switch (config.priceManagerVersion) {
      case "0":
        return new PriceManagerContractConnector(config);
    }
  }

  static makePriceFeedContractConnector(
    feedAddress: string
  ): IContractConnector<IPriceFeedContractAdapter> {
    switch (config.priceManagerVersion) {
      case "0":
        return new PriceFeedContractConnector(config, feedAddress);
    }
  }
}
