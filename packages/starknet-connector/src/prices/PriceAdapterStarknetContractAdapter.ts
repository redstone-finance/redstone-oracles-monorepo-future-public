import {
  ContractParamsProvider,
  IPricesContractAdapter,
} from "@redstone-finance/sdk";
import { Contract } from "starknet";
import { FEE_MULTIPLIER } from "../StarknetContractConnector";
import { extractNumbers, getNumberFromStarknetResult } from "../starknet-utils";

export class PriceAdapterStarknetContractAdapter
  implements IPricesContractAdapter
{
  constructor(private contract: Contract) {}

  async writePricesFromPayloadToContract(
    paramsProvider: ContractParamsProvider
  ): Promise<string> {
    return (
      await this.contract.invoke(
        "write_prices",
        [
          paramsProvider.getHexlifiedFeedIds(),
          await paramsProvider.getPayloadData(),
        ],
        { maxFee: 0.0004 * FEE_MULTIPLIER, parseRequest: true }
      )
    ).transaction_hash;
  }

  async getPricesFromPayload(
    paramsProvider: ContractParamsProvider
  ): Promise<number[]> {
    return extractNumbers(
      await this.contract.call("get_prices", [
        paramsProvider.getHexlifiedFeedIds(),
        await paramsProvider.getPayloadData(),
      ])
    );
  }

  async readPricesFromContract(
    paramsProvider: ContractParamsProvider
  ): Promise<number[]> {
    return extractNumbers(
      await this.contract.call("read_prices", [
        paramsProvider.getHexlifiedFeedIds(),
      ])
    );
  }

  async readTimestampFromContract(): Promise<number> {
    return getNumberFromStarknetResult(
      await this.contract.call("read_timestamp")
    );
  }
}
