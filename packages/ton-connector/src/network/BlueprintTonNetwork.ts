import { TonClient, TonClient4 } from "ton";
import { Address, Contract, OpenedContract, Sender } from "ton-core";
import { NetworkProvider } from "@ton-community/blueprint";
import { TonApiV2Config, TonNetwork } from "./TonNetwork";

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
    this.api = networkProvider.api();
    this.workchain = networkProvider.network() == "testnet" ? 0 : -1;
    this.walletAddress = networkProvider.sender().address;
  }

  open<T extends Contract>(contract: T): OpenedContract<T> {
    return this.networkProvider.open(contract);
  }

  isContractDeployed(address: Address): Promise<boolean> {
    return this.networkProvider.isContractDeployed(address);
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- Interface conformance
  async setUp() {
    // nop;
  }
}
