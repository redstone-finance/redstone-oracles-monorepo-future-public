import { Cell } from "@ton/core";
import { TonNetwork } from "../../src";
import { TonContractDeployer } from "../../src/TonContractDeployer";
import { TonInitData } from "../../src/TonInitData";
import { TonUnitTester } from "./TonUnitTester";
import { TonUnitTesterContractAdapter } from "./TonUnitTesterContractAdapter";

export class TonUnitTesterContractDeployer extends TonContractDeployer<
  TonUnitTester,
  TonUnitTesterContractAdapter
> {
  constructor(network: TonNetwork, code: Cell, initData?: TonInitData) {
    super(TonUnitTester, network, code, initData);
  }

  async getAdapter(): Promise<TonUnitTesterContractAdapter> {
    const contract = await this.getContract();
    await contract.sendDeploy();

    return new TonUnitTesterContractAdapter(contract);
  }
}
