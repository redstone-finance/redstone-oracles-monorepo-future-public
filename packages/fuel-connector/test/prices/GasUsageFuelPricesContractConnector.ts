import {
  FuelPricesContractAdapter,
  FuelPricesContractConnector,
} from "../../src";
import { InvocationResult } from "fuels";
import { IPricesContractAdapter } from "@redstone-finance/sdk";

export class GasUsageFuelPricesContractConnector extends FuelPricesContractConnector {
  override getAdapter(): Promise<IPricesContractAdapter> {
    return Promise.resolve(
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

  protected static override extractNumbers(result: InvocationResult): number[] {
    return [result.gasUsed.toNumber()];
  }
}
