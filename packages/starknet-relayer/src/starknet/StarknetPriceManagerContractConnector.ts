import { IContractConnector, ContractParamsProvider } from "redstone-sdk";
import { Contract } from "starknet";
import price_manager_abi from "../config/price_manager_abi.json";
import { StarknetRelayerContractConnector } from "./StarknetRelayerContractConnector";
import {
  FEE_MULTIPLIER,
  StarknetContractParamsProvider,
} from "@redstone-finance/starknet-connector";

const DATA_SERVICE_ID = "redstone-avalanche-prod";
const UNIQUE_SIGNER_COUNT = 1;
const DATA_FEEDS = ["ETH", "BTC"];

export class StarknetPriceManagerContractConnector
  extends StarknetRelayerContractConnector
  implements IContractConnector<StarknetPriceManagerContractAdapter>
{
  private readonly paramsProvider: ContractParamsProvider;

  constructor(config: any) {
    super(price_manager_abi, config);

    this.paramsProvider = new StarknetContractParamsProvider({
      dataServiceId: DATA_SERVICE_ID,
      uniqueSignersCount: UNIQUE_SIGNER_COUNT,
      dataFeeds: DATA_FEEDS,
    });
  }

  async getAdapter(): Promise<StarknetPriceManagerContractAdapter> {
    return new StarknetPriceManagerContractAdapter(
      this.getContract(),
      this.paramsProvider,
      this.config.maxEthFee
    );
  }
}

class StarknetPriceManagerContractAdapter {
  constructor(
    private readonly contract: Contract,
    private readonly paramsProvider: ContractParamsProvider,
    private readonly maxEthFee: number = 0.004
  ) {}

  async readTimestampAndRound(): Promise<any> {
    const result = await this.contract.call("read_round_data");

    return {
      payload_timestamp: result.payload_timestamp.toNumber() * 1000,
      round: result.round.toNumber(),
      block_number: result.block_number.toNumber(),
      block_timestamp: result.block_timestamp.toNumber() * 1000,
    };
  }

  async writePrices(round: number): Promise<string> {
    return (
      await this.contract.invoke(
        "write_prices",
        [
          round,
          this.paramsProvider.getHexlifiedFeedIds(),
          await this.paramsProvider.getPayloadData(),
        ],
        { maxFee: this.maxEthFee * FEE_MULTIPLIER }
      )
    ).transaction_hash;
  }
}
