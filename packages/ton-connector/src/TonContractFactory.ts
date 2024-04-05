import { Address, Cell, contractAddress } from "@ton/core";
import { TonContract } from "./TonContract";
import { TonContractError } from "./TonContractError";
import { TonInitData } from "./TonInitData";
import { TonNetwork } from "./network/TonNetwork";

export class TonContractFactory {
  constructor(private contractType: typeof TonContract) {}

  async makeForExecute(
    network: TonNetwork,
    address: string
  ): Promise<TonContract> {
    const contract = new this.contractType(Address.parse(address));

    await contract.connect(network);

    return contract;
  }

  async makeForDeploy(
    code: Cell,
    network: TonNetwork,
    initData?: TonInitData
  ): Promise<TonContract> {
    const { address, contract } = this.openContractCode(
      code,
      network.workchain,
      initData ?? new TonInitData()
    );

    if (await network.isContractDeployed(address)) {
      throw new TonContractError("Contract already deployed", contract);
    }

    await contract.connect(network);

    return contract;
  }

  private openContractCode(
    code: Cell,
    workchain: number,
    initData: TonInitData
  ): { address: Address; contract: TonContract } {
    const data = initData.toCell();
    const address = contractAddress(workchain, { code, data });
    const contract = new this.contractType(address, { code, data });

    return { address, contract };
  }
}
