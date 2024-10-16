import { IContractConnector } from "@redstone-finance/sdk";
import { Account } from "fuels";
import { FUEL_BASE_GAS_LIMIT, FuelConnector } from "./FuelConnector";

export abstract class FuelContractConnector<Adapter>
  extends FuelConnector
  implements IContractConnector<Adapter>
{
  protected constructor(
    protected wallet?: Account,
    gasLimit = FUEL_BASE_GAS_LIMIT
  ) {
    super(wallet?.provider.url, gasLimit);
  }

  abstract getAdapter(): Promise<Adapter>;

  waitForTransaction(_txId: string): Promise<boolean> {
    return Promise.resolve(true);
  }
}
