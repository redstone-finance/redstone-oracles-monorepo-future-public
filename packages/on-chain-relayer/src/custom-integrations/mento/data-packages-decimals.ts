import {
  getNumericDataPointDecimals,
  NumericDataPoint,
} from "@redstone-finance/protocol";
import {
  IterationArgsMessage,
  RelayerConfig,
  ShouldUpdateContext,
} from "../../types";

const MENTO_SUPPORTED_DECIMALS = 8;

export const checkIfDataPackagesDecimalsAreAcceptable = (
  context: ShouldUpdateContext,
  relayerConfig: RelayerConfig
): { shouldNotUpdatePrice: boolean; messages: IterationArgsMessage[] } => {
  if (relayerConfig.adapterContractType !== "mento") {
    return { shouldNotUpdatePrice: false, messages: [] };
  }
  const { dataPackages } = context;
  const dataFeedIds = Object.keys(dataPackages);

  for (const dataFeedId of dataFeedIds) {
    for (const signedDataPackage of dataPackages[dataFeedId]!) {
      for (const dataPoint of signedDataPackage.dataPackage.dataPoints) {
        if (
          !(dataPoint instanceof NumericDataPoint) ||
          getNumericDataPointDecimals(dataPoint.toObj()) !==
            MENTO_SUPPORTED_DECIMALS
        ) {
          const message = `Cannot update prices in mento adapter, some decimals are different than ${MENTO_SUPPORTED_DECIMALS} ${JSON.stringify(
            { dataFeedId, dataPoint: dataPoint.toObj() }
          )}`;
          return { shouldNotUpdatePrice: true, messages: [{ message }] };
        }
      }
    }
  }

  return { shouldNotUpdatePrice: false, messages: [] };
};
