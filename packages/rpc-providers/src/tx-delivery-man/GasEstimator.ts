import { providers } from "ethers";
import { FeeStructure } from "./TxDelivery";

export interface GasEstimator<T extends FeeStructure> {
  getFees(provider: providers.JsonRpcProvider): Promise<T>;
  scaleFees(currentFees: T, attempt: number): T;
}
