import { BigNumberish } from "ethers";
import { ContractParamsProvider } from "../ContractParamsProvider";

export interface IPricesContractAdapter {
  // Reads on-chain the returned by paramsProvider RedStone payload data and returns aggregated price values
  // for the feeds passed through the paramsProvider. It doesn't modify the contract's storage.
  getPricesFromPayload(
    paramsProvider: ContractParamsProvider
  ): Promise<BigNumberish[]>;

  // Reads on-chain the returned by paramsProvider RedStone payload data and writes aggregated price values
  // for the feeds passed through the paramsProvider to the contract's storage.
  writePricesFromPayloadToContract(
    paramsProvider: ContractParamsProvider
  ): Promise<string | BigNumberish[]>;

  // Reads the lastly written to the contract's storage aggregated price values for the feeds passed through the
  // paramsProvider. It doesn't modify the contract's storage and also doesn't take the RedStone payload as an argument
  readPricesFromContract(
    paramsProvider: ContractParamsProvider
  ): Promise<BigNumberish[]>;

  // Reads the timestamp of the lastly written values to the contract's storage.
  // It doesn't modify the contract's storage
  readTimestampFromContract(): Promise<number>;

  getUniqueSignerThreshold?: () => Promise<number>;
}
