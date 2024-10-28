import { ContractParamsProvider } from "@redstone-finance/sdk";
import { BigNumberish } from "ethers";
import {
  FuelPricesContractAdapter,
  FuelPricesContractConnector,
} from "../../src";

export class GasUsageFuelPricesContractConnector extends FuelPricesContractConnector {
  override async getAdapter() {
    return await Promise.resolve(
      new GasUsageFuelPricesContractAdapter(
        await this.getContract(),
        this.getGasLimit()
      )
    );
  }
}

class GasUsageFuelPricesContractAdapter extends FuelPricesContractAdapter {
  override async getPricesFromPayload(
    paramsProvider: ContractParamsProvider
  ): Promise<BigNumberish[]> {
    return [(await this.callGetPrices(paramsProvider)).gasUsed.toNumber()];
  }

  override async writePricesFromPayloadToContract(
    paramsProvider: ContractParamsProvider
  ): Promise<BigNumberish[]> {
    return [(await this.callWritePrices(paramsProvider)).gasUsed.toNumber()];
  }

  override async readPricesFromContract(
    paramsProvider: ContractParamsProvider
  ): Promise<BigNumberish[]> {
    return [(await this.callReadPrices(paramsProvider)).gasUsed.toNumber()];
  }

  override async readTimestampFromContract(): Promise<number> {
    return (await this.callReadTimestamp()).gasUsed.toNumber();
  }
}
