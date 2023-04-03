import { IContractConnector } from "redstone-sdk";
import { Contract } from "starknet";
import price_feed_abi from "../config/price_feed_abi.json";
import { StarknetRelayerContractConnector } from "./StarknetRelayerContractConnector";

export class StarknetPriceFeedContractConnector
  extends StarknetRelayerContractConnector
  implements IContractConnector<StarknetPriceFeedContractAdapter>
{
  constructor(config: any, private readonly feedContractAddress: string) {
    super(price_feed_abi, config, feedContractAddress);
  }

  async getAdapter(): Promise<StarknetPriceFeedContractAdapter> {
    return new StarknetPriceFeedContractAdapter(this.getContract());
  }
}

export class StarknetPriceFeedContractAdapter {
  constructor(private readonly contract: Contract) {}

  async readLatestRoundData(): Promise<any> {
    return (await this.contract.call("latest_round_data"))[0];
  }
}
