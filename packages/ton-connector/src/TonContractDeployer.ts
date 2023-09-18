import { TonContract } from "./TonContract";
import { TonInitData } from "./TonInitData";
import { TonContractFactory } from "./TonContractFactory";
import { TonContractConnector } from "./TonContractConnector";
import { TonNetwork } from "./network/TonNetwork";

import { Cell } from "ton-core";

export abstract class TonContractDeployer<
  Contract extends TonContract,
  Adapter,
> extends TonContractConnector<Contract, Adapter> {
  protected constructor(
    contractType: typeof TonContract,
    network: TonNetwork,
    protected code: Cell,
    protected initData?: TonInitData
  ) {
    super(contractType, network);
  }

  override async makeContract(
    contractFactory: TonContractFactory
  ): Promise<TonContract> {
    return await contractFactory.makeForDeploy(
      this.code,
      this.network,
      this.initData
    );
  }
}
