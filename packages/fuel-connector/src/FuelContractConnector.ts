import { WalletLocked, WalletUnlocked } from "fuels";
import { FuelConnector } from "./FuelConnector";

export abstract class FuelContractConnector<Adapter> extends FuelConnector {
  protected constructor(
    protected wallet: WalletLocked | WalletUnlocked | undefined
  ) {
    super(wallet?.provider.url);
  }

  abstract getAdapter(): Promise<Adapter>;
}
