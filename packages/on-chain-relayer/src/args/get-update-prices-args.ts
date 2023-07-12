import { WrapperBuilder } from "@redstone-finance/evm-connector";
import { Contract } from "ethers";
import { DataPackagesResponse } from "redstone-sdk";

export interface UpdatePricesArgs {
  adapterContract: Contract;
  proposedTimestamp: number;

  wrapContract(adapterContract: Contract): Contract;
}

export const getUpdatePricesArgs = async (
  dataPackages: DataPackagesResponse,
  adapterContract: Contract,
  lastUpdateTimestamp: number
): Promise<{ args?: UpdatePricesArgs; message?: string }> => {
  const dataPackagesTimestamps = Object.values(dataPackages).flatMap(
    (dataPackages) =>
      dataPackages.map(
        (dataPackage) => dataPackage.dataPackage.timestampMilliseconds
      )
  );
  const minimalTimestamp = Math.min(...dataPackagesTimestamps);

  if (lastUpdateTimestamp >= minimalTimestamp) {
    const message = `Cannot update prices, proposed prices are not newer ${JSON.stringify(
      {
        lastUpdateTimestamp,
        dataPackageTimestamp: minimalTimestamp,
      }
    )}`;

    return { message };
  } else {
    const wrapContract = (adapterContract: Contract) =>
      WrapperBuilder.wrap(adapterContract).usingDataPackages(dataPackages);
    let args = {
      adapterContract,
      wrapContract,
      proposedTimestamp: minimalTimestamp,
    };

    return { args };
  }
};
