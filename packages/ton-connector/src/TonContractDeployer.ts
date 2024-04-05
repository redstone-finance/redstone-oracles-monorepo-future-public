import { Cell } from "@ton/core";
import { TonContract } from "./TonContract";
import { TonContractConnector } from "./TonContractConnector";
import { TonContractFactory } from "./TonContractFactory";
import { TonInitData } from "./TonInitData";
import { TonNetwork } from "./network/TonNetwork";

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
