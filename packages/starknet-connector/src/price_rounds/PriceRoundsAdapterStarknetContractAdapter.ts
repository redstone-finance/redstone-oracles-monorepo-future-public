import {
  ContractParamsProvider,
  IPriceManagerContractAdapter,
  PriceManagerMetadata,
} from "@redstone-finance/sdk";
import { Contract } from "starknet";
import { FEE_MULTIPLIER } from "../StarknetContractConnector";
import { getNumberFromStarknetResult } from "../starknet-utils";

interface RoundData {
  payload_timestamp: number;
  round_number: number;
  block_number: number;
  block_timestamp: number;
}

export class PriceRoundsAdapterStarknetContractAdapter
  implements IPriceManagerContractAdapter
{
  constructor(
    private readonly contract: Contract,
    private readonly paramsProvider: ContractParamsProvider,
    private readonly maxEthFee: number = 0.0004
  ) {}

  async readTimestampAndRound(): Promise<PriceManagerMetadata> {
    const result = (await this.contract.call("read_round_data")) as RoundData;

    return {
      payload_timestamp:
        getNumberFromStarknetResult(result.payload_timestamp) * 1000,
      round: getNumberFromStarknetResult(result.round_number),
      block_number: getNumberFromStarknetResult(result.block_number),
      block_timestamp:
        getNumberFromStarknetResult(result.block_timestamp) * 1000,
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
        { maxFee: this.maxEthFee * FEE_MULTIPLIER, parseRequest: true }
      )
    ).transaction_hash;
  }
}
