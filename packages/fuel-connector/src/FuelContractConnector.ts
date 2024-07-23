import { IContractConnector } from "@redstone-finance/sdk";
import { Account } from "fuels";
import { FuelConnector } from "./FuelConnector";

export abstract class FuelContractConnector<Adapter>
  extends FuelConnector
  implements IContractConnector<Adapter>
{
  protected constructor(protected wallet?: Account) {
    super(wallet?.provider.url);
  }

  abstract getAdapter(): Promise<Adapter>;

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  waitForTransaction(_txId: string): Promise<boolean> {
    return Promise.resolve(true);
  }
}
