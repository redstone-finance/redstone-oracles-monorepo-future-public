import {
  Address,
  beginCell,
  Cell,
  Contract,
  ContractProvider,
} from "@ton/core";
import { Maybe } from "@ton/core/src/utils/maybe";
import { Ton } from "./Ton";

export class TonContract extends Ton implements Contract {
  static getName(): string {
    throw new Error("Must be overridden; Return the contract-filename here;");
  }

  // the v4 api is using only GET methods with limited parameter length, so it works only when the payload is small;
  // also doesn't support ECRECOVER
  protected shouldUseOldApi = true; // !!this.oldApi;

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

  protected getAltApiContractProvider(provider: ContractProvider) {
    return this.shouldUseOldApi
      ? this.oldApi?.provider(this.address, null) ?? provider
      : provider;
  }
}
