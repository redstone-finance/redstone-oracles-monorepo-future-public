import { WrapperBuilder } from "@redstone-finance/evm-connector";
import { Contract } from "ethers";
import { DataPackagesResponse } from "redstone-sdk";
import { chooseDataPackagesTimestamp } from "../core/update-conditions/data-packages-timestamp";

export interface UpdatePricesArgs {
  adapterContract: Contract;
  proposedTimestamp: number;
  wrapContract(adapterContract: Contract): Contract;
}

export const getUpdatePricesArgs = (
  dataPackages: DataPackagesResponse,
  adapterContract: Contract
): UpdatePricesArgs => {
  const proposedTimestamp = chooseDataPackagesTimestamp(dataPackages);

  const wrapContract = (adapterContract: Contract) =>
    WrapperBuilder.wrap(adapterContract).usingDataPackages(dataPackages);

  return {
    adapterContract,
    wrapContract,
    proposedTimestamp,
  };
};
