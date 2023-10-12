import { WrapperBuilder } from "@redstone-finance/evm-connector";
import { DataPackagesResponse } from "@redstone-finance/sdk";
import { chooseDataPackagesTimestamp } from "../core/update-conditions/data-packages-timestamp";
import { RedstoneAdapterBase } from "../../typechain-types";

export interface UpdatePricesArgs {
  adapterContract: RedstoneAdapterBase;
  proposedTimestamp: number;
  wrapContract(adapterContract: RedstoneAdapterBase): RedstoneAdapterBase;
}

export const getUpdatePricesArgs = (
  dataPackages: DataPackagesResponse,
  adapterContract: RedstoneAdapterBase
): UpdatePricesArgs => {
  const proposedTimestamp = chooseDataPackagesTimestamp(dataPackages);

  const wrapContract = (adapterContract: RedstoneAdapterBase) =>
    WrapperBuilder.wrap(adapterContract).usingDataPackages(dataPackages);

  return {
    adapterContract,
    wrapContract,
    proposedTimestamp,
  };
};
