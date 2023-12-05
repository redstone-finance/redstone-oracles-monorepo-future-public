import { AnyTonOpenedContract, TonNetwork } from "../../src";
import { Address, Contract, Sender } from "@ton/core";
import { TonClient, TonClient4 } from "@ton/ton";
import { Blockchain } from "@ton/sandbox";

export class SandboxTonNetwork implements TonNetwork {
  api?: TonClient4;
  oldApi?: TonClient;
  workchain = 0;
  walletAddress?: Address;

  constructor(
    public sender: Sender,
    protected blockchain: Blockchain
  ) {
    this.walletAddress = this.sender.address;
  }

  open<T extends Contract>(contract: T): AnyTonOpenedContract<T> {
    return this.blockchain.openContract(contract);
  }

  isContractDeployed(address: Address): Promise<boolean> {
    return Promise.resolve(address === this.walletAddress);
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- Interface conformance
  async setUp() {
    // nop
  }
}
