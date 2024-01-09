import { Cell } from "@ton/core";
import { TonNetwork } from "../../src";
import { TonContractDeployer } from "../../src/TonContractDeployer";
import { TonInitData } from "../../src/TonInitData";
import { TonTester } from "./TonTester";
import { TonTesterContractAdapter } from "./TonTesterContractAdapter";

export class TonTesterContractDeployer extends TonContractDeployer<
  TonTester,
  TonTesterContractAdapter
> {
  constructor(network: TonNetwork, code: Cell, initData?: TonInitData) {
    super(TonTester, network, code, initData);
  }

  async getAdapter(): Promise<TonTesterContractAdapter> {
    const contract = await this.getContract();
    await contract.sendDeploy();

    return new TonTesterContractAdapter(contract);
  }
}
