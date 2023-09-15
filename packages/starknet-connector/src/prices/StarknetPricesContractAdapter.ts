import { Contract, Result } from "starknet";
import {
  ContractParamsProvider,
  IPricesContractAdapter,
} from "@redstone-finance/sdk";
import { FEE_MULTIPLIER } from "../StarknetContractConnector";
import { getNumberFromStarknetResult } from "../starknet-utils";

export class StarknetPricesContractAdapter implements IPricesContractAdapter {
  constructor(private contract: Contract) {}

  protected static extractNumbers(response: Result): number[] {
    return (response as Result[]).map(getNumberFromStarknetResult);
  }

  async writePricesFromPayloadToContract(
    paramsProvider: ContractParamsProvider
  ): Promise<string> {
    return (
      await this.contract.invoke(
        "save_prices",
        [
          paramsProvider.getHexlifiedFeedIds(),
          await paramsProvider.getPayloadData(),
        ],
        { maxFee: 0.004 * FEE_MULTIPLIER, parseRequest: true }
      )
    ).transaction_hash;
  }

  async getPricesFromPayload(
    paramsProvider: ContractParamsProvider
  ): Promise<number[]> {
    return StarknetPricesContractAdapter.extractNumbers(
      await this.contract.call("get_prices", [
        paramsProvider.getHexlifiedFeedIds(),
        await paramsProvider.getPayloadData(),
      ])
    );
  }

  async readPricesFromContract(
    paramsProvider: ContractParamsProvider
  ): Promise<number[]> {
    return StarknetPricesContractAdapter.extractNumbers(
      await this.contract.call("get_saved_prices", [
        paramsProvider.getHexlifiedFeedIds(),
      ])
    );
  }

  async readTimestampFromContract(): Promise<number> {
    return getNumberFromStarknetResult(
      await this.contract.call("get_saved_timestamp")
    );
  }
}
