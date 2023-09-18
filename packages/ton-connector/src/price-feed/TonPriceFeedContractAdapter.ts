import { OpenedContract } from "ton";
import { SandboxContract } from "@ton-community/sandbox";
import { TonPriceFeed } from "../../wrappers/TonPriceFeed";

export class TonPriceFeedContractAdapter {
  constructor(
    public readonly contract:
      | OpenedContract<TonPriceFeed>
      | SandboxContract<TonPriceFeed>
  ) {}

  async sendDeploy(): Promise<void> {
    await this.contract.sendDeploy();
  }

  async getData() {
    return await this.contract.getData();
  }

  async fetchData() {
    await this.contract.sendFetchData();
  }
}
