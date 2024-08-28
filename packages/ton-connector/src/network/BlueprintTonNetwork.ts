import { NetworkProvider } from "@ton/blueprint";
import { Address, Contract, Sender } from "@ton/core";
import { TonClient, TonClient4 } from "@ton/ton";
import { AnyTonOpenedContract, TonApiV2Config, TonNetwork } from "./TonNetwork";

export class BlueprintTonNetwork implements TonNetwork {
  oldApi: TonClient;
  sender: Sender;
  api: TonClient4;
  workchain: number;
  walletAddress?: Address;

  constructor(
    private networkProvider: NetworkProvider,
    apiV2Config: TonApiV2Config
  ) {
    this.oldApi = new TonClient(apiV2Config);
    this.sender = networkProvider.sender();
    this.api = networkProvider.api() as TonClient4;
    this.workchain = networkProvider.network() == "testnet" ? 0 : -1;
    this.walletAddress = networkProvider.sender().address;
  }

  open<T extends Contract>(contract: T): AnyTonOpenedContract<T> {
    return this.networkProvider.open(contract);
  }

  isContractDeployed(address: Address): Promise<boolean> {
    return this.networkProvider.isContractDeployed(address);
  }

  async setUp() {
    // nop;
  }
}
