import { ContractParamsProvider } from "@redstone-finance/sdk";
import { AnyTonOpenedContract } from "../../src";
import { TonTester } from "./TonTester";

export class TonTesterContractAdapter {
  constructor(public readonly contract: AnyTonOpenedContract<TonTester>) {}

  async testProcessPayload(
    paramsProvider: ContractParamsProvider,
    signers: string[],
    uniqueSignersThreshold: number,
    currentTimestamp: number
  ) {
    return await this.contract.getTestProcessPayload(
      paramsProvider,
      signers,
      uniqueSignersThreshold,
      currentTimestamp
    );
  }
}
