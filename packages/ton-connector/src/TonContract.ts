import { Address, beginCell, Cell, Contract, ContractProvider } from "ton-core";
import { Ton } from "./Ton";
import { Maybe } from "ton-core/src/utils/maybe";

export class TonContract extends Ton implements Contract {
  static getName(): string {
    throw "Must be overridden; Return the contract-filename here;";
  }

  constructor(
    readonly address: Address,
    readonly init?: Maybe<{ code: Cell; data: Cell }>
  ) {
    super();
  }

  async sendDeploy(provider: ContractProvider) {
    console.log("Contract address:", this.address.toString());

    return await this.internalMessage(provider, 0.05, beginCell().endCell());
  }
}
