import { IPriceFeedContractAdapter } from "redstone-sdk";
import price_feed_abi from "../../config/price_feed_abi.json";
import { RelayerStarknetContractConnector } from "../RelayerStarknetContractConnector";
import { PriceFeedContractAdapter } from "./PriceFeedContractAdapter";
import { StarknetRelayerConfig } from "../../config";

export class PriceFeedContractConnector extends RelayerStarknetContractConnector<IPriceFeedContractAdapter> {
  constructor(
    config: StarknetRelayerConfig,
    private readonly feedContractAddress: string
  ) {
    super(price_feed_abi, config, feedContractAddress);
  }

  getAdapter(): Promise<IPriceFeedContractAdapter> {
    return Promise.resolve(new PriceFeedContractAdapter(this.getContract()));
  }
}
