import { ContractParamsProvider, IPricesContractAdapter } from "redstone-sdk";
import { FuelPricesContract } from "./FuelPricesContractConnector";
import { num, u256 } from "../u256-utils";
import { InvocationResult } from "fuels";

export class FuelPricesContractAdapter implements IPricesContractAdapter {
  constructor(
    protected contract: FuelPricesContract,
    private gasLimit: number
  ) {}

  async getPricesFromPayload(
    paramsProvider: ContractParamsProvider
  ): Promise<number[]> {
    return this.extractNumbers(
      await this.contract.functions
        .get_prices(
          paramsProvider.getHexlifiedFeedIds().map(u256),
          (await paramsProvider.getPayloadData()) as number[]
        )
        .get()
    );
  }

  async writePricesFromPayloadToContract(
    paramsProvider: ContractParamsProvider
  ): Promise<string | number[]> {
    return this.extractNumbers(
      await this.contract.functions
        .write_prices(
          paramsProvider.getHexlifiedFeedIds().map(u256),
          (await paramsProvider.getPayloadData()) as number[]
        )
        .txParams({
          gasLimit: this.gasLimit,
          gasPrice: 1,
        })
        .call()
    );
  }

  async readPricesFromContract(
    paramsProvider: ContractParamsProvider
  ): Promise<number[]> {
    return this.extractNumbers(
      await this.contract.functions
        .read_prices(paramsProvider.getHexlifiedFeedIds().map(u256))
        .get()
    );
  }

  async readTimestampFromContract(): Promise<number> {
    return (
      await this.contract.functions.read_timestamp().get()
    ).value.toNumber();
  }

  protected extractNumbers(result: InvocationResult): number[] {
    return result.value.map(num);
  }
}
