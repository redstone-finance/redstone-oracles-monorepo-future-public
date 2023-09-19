import {
  ContractParamsProvider,
  IPricesContractAdapter,
} from "@redstone-finance/sdk";
import { TonPriceManager } from "../../wrappers/TonPriceManager";
import { AnyTonOpenedContract } from "../network/TonNetwork";

export class TonPriceManagerContractAdapter implements IPricesContractAdapter {
  constructor(
    public readonly contract: AnyTonOpenedContract<TonPriceManager>
  ) {}

  async sendDeploy(): Promise<void> {
    await this.contract.sendDeploy();
  }

  async getPricesFromPayload(
    paramsProvider: ContractParamsProvider
  ): Promise<bigint[]> {
    return await this.contract.getPrices(paramsProvider);
  }

  async writePricesFromPayloadToContract(
    paramsProvider: ContractParamsProvider
  ): Promise<string | bigint[]> {
    await this.contract.sendWritePrices(paramsProvider);

    return "";
  }

  async readPricesFromContract(
    paramsProvider: ContractParamsProvider
  ): Promise<bigint[]> {
    return await this.contract.getReadPrices(paramsProvider);
  }

  async readTimestampFromContract(): Promise<number> {
    return await this.contract.getReadTimestamp();
  }
}
