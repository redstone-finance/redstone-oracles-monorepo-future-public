import { IContractConnector, IPriceFeedContractAdapter } from "redstone-sdk";
import price_feed_abi from "../../config/price_feed_abi.json";
import { RelayerStarknetContractConnector } from "../RelayerStarknetContractConnector";
import { PriceFeedContractAdapter } from "./PriceFeedContractAdapter";

export class PriceFeedContractConnector
  extends RelayerStarknetContractConnector
  implements IContractConnector<IPriceFeedContractAdapter>
{
  constructor(config: any, private readonly feedContractAddress: string) {
    super(price_feed_abi, config, feedContractAddress);
  }

  async getAdapter(): Promise<IPriceFeedContractAdapter> {
    return new PriceFeedContractAdapter(this.getContract());
  }
}
