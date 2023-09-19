import { TonNetwork } from "../../src";
import { Address, Contract, OpenedContract, Sender } from "ton-core";
import { TonClient, TonClient4 } from "ton";
import { Blockchain, SandboxContract } from "@ton-community/sandbox";
import { TreasuryContract } from "@ton-community/sandbox/dist/treasury/Treasury";

export class TestTonNetwork implements TonNetwork {
  sender: Sender;
  api?: TonClient4;
  oldApi?: TonClient;
  workchain = 0;
  walletAddress?: Address;

  constructor(
    protected blockchain: Blockchain,
    deployer: SandboxContract<TreasuryContract>
  ) {
    this.sender = deployer.getSender();
    this.walletAddress = this.sender.address;
  }

  open<T extends Contract>(
    contract: T
  ): OpenedContract<T> | SandboxContract<T> {
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
