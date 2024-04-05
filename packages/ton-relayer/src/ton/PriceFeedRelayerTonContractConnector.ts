import { IContractConnector } from "@redstone-finance/sdk";
import { TonPriceFeedContractConnector } from "@redstone-finance/ton-connector";
import { PriceFeedRelayerTonContractAdapter } from "./PriceFeedRelayerTonContractAdapter";

export class PriceFeedRelayerTonContractConnector
  extends TonPriceFeedContractConnector
  implements IContractConnector<PriceFeedRelayerTonContractAdapter>
{
  override async getAdapter(): Promise<PriceFeedRelayerTonContractAdapter> {
    return new PriceFeedRelayerTonContractAdapter(await this.getContract());
  }
}
