import { config } from "../config";
import { PriceManagerContractConnector } from "./cairo0/PriceManagerContractConnector";
import {
  IContractConnector,
  IPriceFeedContractAdapter,
  IPriceManagerContractAdapter,
} from "@redstone-finance/sdk";
import { PriceFeedContractConnector } from "./cairo0/PriceFeedContractConnector";

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
