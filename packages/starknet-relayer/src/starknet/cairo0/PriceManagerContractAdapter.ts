import {
  ContractParamsProvider,
  IPriceManagerContractAdapter,
  PriceManagerMetadata,
} from "@redstone-finance/sdk";
import {
  FEE_MULTIPLIER,
  getNumberFromStarknetResult,
} from "@redstone-finance/starknet-connector";
import { BigNumberish } from "ethers";
import { Contract } from "starknet";

export class PriceManagerContractAdapter
  implements IPriceManagerContractAdapter
{
  constructor(
    private readonly contract: Contract,
    private readonly paramsProvider: ContractParamsProvider,
    private readonly maxEthFee: number = 0.004
  ) {}

  async readTimestampAndRound(): Promise<PriceManagerMetadata> {
    const result = (await this.contract.call("read_round_data")) as {
      [key: string]: BigNumberish;
    };

    return {
      payload_timestamp:
        getNumberFromStarknetResult(result["payload_timestamp"]) * 1000,
      round: getNumberFromStarknetResult(result["round"]),
      block_number: getNumberFromStarknetResult(result["block_number"]),
      block_timestamp:
        getNumberFromStarknetResult(result["block_timestamp"]) * 1000,
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
