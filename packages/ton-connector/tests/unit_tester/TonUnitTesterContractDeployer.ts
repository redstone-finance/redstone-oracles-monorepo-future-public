import { TonContractDeployer } from "../../src/TonContractDeployer";
import { TonNetwork } from "../../src/network/TonNetwork";
import { Cell } from "ton-core";
import { TonUnitTester } from "./TonUnitTester";
import { TonInitData } from "../../src/TonInitData";
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
