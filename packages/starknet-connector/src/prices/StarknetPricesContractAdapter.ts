import { Contract, Result } from "starknet";
import { ContractParamsProvider, IPricesContractAdapter } from "redstone-sdk";
import { FEE_MULTIPLIER } from "../StarknetContractConnector";
import { getNumberFromStarknet } from "../starknet-utils";

export class StarknetPricesContractAdapter implements IPricesContractAdapter {
  constructor(private contract: Contract) {}

  async getPricesFromPayload(
    paramsProvider: ContractParamsProvider
  ): Promise<number[]> {
    return this.extractNumbers(
      await this.contract.call("get_prices", [
        paramsProvider.getHexlifiedFeedIds(),
        await paramsProvider.getPayloadData(),
      ])
    );
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

  async readPricesFromContract(
    paramsProvider: ContractParamsProvider
  ): Promise<number[]> {
    return this.extractNumbers(
      await this.contract.call("get_saved_prices", [
        paramsProvider.getHexlifiedFeedIds(),
      ])
    );
  }

  async readTimestampFromContract(): Promise<number> {
    return getNumberFromStarknet(
      await this.contract.call("get_saved_timestamp")
    );
  }

  protected extractNumbers(response: Result): number[] {
    return (response as Result[]).map((value: any) =>
      getNumberFromStarknet(value)
    );
  }
}
