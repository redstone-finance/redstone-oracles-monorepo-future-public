import { IContractConnector } from "@redstone-finance/sdk";
import { providers } from "ethers";
import { IRedstoneContractAdapter } from "./IRedstoneContractAdapter";

export class EvmContractConnector<Adapter extends IRedstoneContractAdapter>
  implements IContractConnector<Adapter>
{
  constructor(
    private provider: providers.Provider,
    private adapter: Adapter
  ) {}

  getAdapter(): Promise<Adapter> {
    return Promise.resolve(this.adapter);
  }

  getBlockNumber(): Promise<number> {
    return this.provider.getBlockNumber();
  }

  waitForTransaction(_txId: string): Promise<boolean> {
    return Promise.resolve(true);
  }
}
