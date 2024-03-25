import { Contracts, RuntimeArgs, StoredValue } from "casper-js-sdk";

export interface ICasperConnection {
  getBlockHeight(): Promise<number>;

  refreshStateRootHash(): Promise<void>;

  getStateRootHash(): string | undefined;

  waitForDeploy(deployHash: string): Promise<boolean>;

  waitForDeploys(deployIds: string[]): Promise<void>;

  queryGlobalState(key: string): Promise<StoredValue>;

  queryContractDictionary<T>(
    contract: Contracts.Contract,
    dictionaryName: string,
    dictionaryItemKey: string,
    decoder: (value: unknown) => T
  ): Promise<T>;

  queryContractData<T>(contract: Contracts.Contract, key: string): Promise<T>;

  callEntrypoint(
    contract: Contracts.Contract,
    entryPoint: string,
    csprAmount: number,
    runtimeArgs: RuntimeArgs
  ): Promise<string>;
}
