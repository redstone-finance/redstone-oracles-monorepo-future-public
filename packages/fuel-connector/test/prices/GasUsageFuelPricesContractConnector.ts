import { IPricesContractAdapter } from "@redstone-finance/sdk";
import { BigNumberish } from "ethers";
import { BN } from "fuels";
import {
  FuelPricesContractAdapter,
  FuelPricesContractConnector,
  InvocationResult,
} from "../../src";

export class GasUsageFuelPricesContractConnector extends FuelPricesContractConnector {
  override async getAdapter(): Promise<IPricesContractAdapter> {
    return await Promise.resolve(
      new GasUsageFuelPricesContractAdapter(
        this.getContract(),
        this.getGasLimit()
      )
    );
  }
}

class GasUsageFuelPricesContractAdapter extends FuelPricesContractAdapter {
  override async readTimestampFromContract(): Promise<number> {
    return (
      await this.contract.functions.read_timestamp().get()
    ).gasUsed.toNumber();
  }

  protected override extractNumbers(
    result: InvocationResult<BN[]>
  ): BigNumberish[] {
    return [result.gasUsed.toNumber()];
  }
}
