import { TonPriceManager } from "../../wrappers/TonPriceManager";
import { TonContractDeployer } from "../TonContractDeployer";
import { PriceManagerInitData } from "./PriceManagerInitData";
import { TonPriceManagerContractAdapter } from "./TonPriceManagerContractAdapter";

import { Cell } from "@ton/core";
import { TonNetwork } from "../network/TonNetwork";

export class TonPriceManagerContractDeployer extends TonContractDeployer<
  TonPriceManager,
  TonPriceManagerContractAdapter
> {
  constructor(
    network: TonNetwork,
    code: Cell,
    initData?: PriceManagerInitData
  ) {
    super(TonPriceManager, network, code, initData);
  }

  async getAdapter(): Promise<TonPriceManagerContractAdapter> {
    const contract = await this.getContract();
    await contract.sendDeploy();

    return new TonPriceManagerContractAdapter(contract);
  }
}
