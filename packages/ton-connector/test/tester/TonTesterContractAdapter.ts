import { TonTester } from "./TonTester";
import { ContractParamsProvider } from "@redstone-finance/sdk";
import { AnyTonOpenedContract } from "../../src";

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
