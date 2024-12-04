import { getDataPackagesTimestamp } from "@redstone-finance/sdk";
import { ShouldUpdateContext } from "../../types";

export const checkIfDataPackageTimestampIsNewer = (
  context: ShouldUpdateContext,
  dataFeedId: string
) => {
  const { dataPackages } = context;
  const lastDataPackageTimestampMS =
    context.dataFromContract[dataFeedId].lastDataPackageTimestampMS;

  const dataPackageTimestamp = getDataPackagesTimestamp(
    dataPackages,
    dataFeedId
  );

  if (lastDataPackageTimestampMS >= dataPackageTimestamp) {
    const message = `Cannot update prices, proposed prices are not newer ${JSON.stringify(
      {
        lastDataPackageTimestampMS,
        dataPackageTimestamp,
      }
    )}`;
    return { shouldNotUpdatePrice: true, messages: [{ message }] };
  }

  return { shouldNotUpdatePrice: false, messages: [] };
};
