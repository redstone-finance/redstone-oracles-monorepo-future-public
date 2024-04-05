import { IPricesContractAdapter } from "@redstone-finance/sdk";
import { TonPriceManager } from "../../wrappers/TonPriceManager";
import { TonContractConnector } from "../TonContractConnector";
import { TonNetwork } from "../network/TonNetwork";
import { TonPriceManagerContractAdapter } from "./TonPriceManagerContractAdapter";

export class TonPriceManagerContractConnector extends TonContractConnector<
  TonPriceManager,
  IPricesContractAdapter
> {
  constructor(network: TonNetwork, address: string) {
    super(TonPriceManager, network, address);
  }

  async getAdapter(): Promise<IPricesContractAdapter> {
    return new TonPriceManagerContractAdapter(await this.getContract());
  }
}
