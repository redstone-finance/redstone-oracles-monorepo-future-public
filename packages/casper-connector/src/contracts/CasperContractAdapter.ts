import { Contracts, RuntimeArgs } from "casper-js-sdk";
import { hexlify } from "ethers/lib/utils";
import assert from "node:assert";
import { ICasperConnection } from "../casper/ICasperConnection";
import { VersionedCasperContract } from "./VersionedCasperContract";

export class CasperContractAdapter {
  constructor(
    public connection: ICasperConnection,
    public contract: Contracts.Contract
  ) {}

  async queryContractDictionary<T>(
    dictionaryName: string,
    dictionaryItemKey: string,
    decoder: (value: unknown) => T = (value) => value as T
  ) {
    return await this.connection.queryContractDictionary<T>(
      this.contract,
      dictionaryName,
      dictionaryItemKey,
      decoder
    );
  }

  async queryContractData<T>(key: string) {
    return await this.connection.queryContractData<T>(this.contract, key);
  }

  async callEntrypoint(
    entryPoint: string,
    csprAmount: number,
    runtimeArgs: RuntimeArgs = RuntimeArgs.fromMap({})
  ) {
    return await this.connection.callEntrypoint(
      this.contract,
      entryPoint,
      csprAmount,
      runtimeArgs
    );
  }

  async queryForContract(key: string): Promise<Contracts.Contract> {
    const address: Uint8Array = await this.queryContractData(key);

    return new VersionedCasperContract(this.connection, hexlify(address));
  }

  async assertWaitForDeployAndRefreshStateRootHash(deployId: string) {
    assert(
      await this.connection.waitForDeploy(deployId),
      `Deploy ${deployId} failed!`
    );
    await this.connection.refreshStateRootHash();
  }
}
