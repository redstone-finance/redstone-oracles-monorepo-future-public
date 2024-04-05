import { IContractConnector } from "@redstone-finance/sdk";
import { VersionedCasperContract } from "../contracts/VersionedCasperContract";
import { ICasperConnection } from "./ICasperConnection";

export abstract class CasperConnector<Adapter>
  implements IContractConnector<Adapter>
{
  constructor(
    protected connection: ICasperConnection,
    private contractPackageHash: string
  ) {}

  abstract getAdapter(): Promise<Adapter>;

  async getBlockNumber(): Promise<number> {
    return await this.connection.getBlockHeight();
  }

  async waitForTransaction(deployHash: string): Promise<boolean> {
    return await this.connection.waitForDeploy(deployHash);
  }

  protected getContract(): VersionedCasperContract {
    return new VersionedCasperContract(
      this.connection,
      this.contractPackageHash
    );
  }
}
