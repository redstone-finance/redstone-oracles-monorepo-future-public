import { Contract } from "starknet";
import {
  ContractParamsProvider,
  IPriceManagerContractAdapter,
  PriceManagerMetadata,
} from "redstone-sdk";
import {
  FEE_MULTIPLIER,
  getNumberFromStarknet,
} from "@redstone-finance/starknet-connector";

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
      [key: string]: any;
    };

    return {
      payload_timestamp:
        getNumberFromStarknet(result["payload_timestamp"]) * 1000,
      round: getNumberFromStarknet(result["round"]),
      block_number: getNumberFromStarknet(result["block_number"]),
      block_timestamp: getNumberFromStarknet(result["block_timestamp"]) * 1000,
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
