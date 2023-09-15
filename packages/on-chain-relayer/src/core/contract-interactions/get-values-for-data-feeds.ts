import { Contract, utils } from "ethers";
import { config } from "../../config";
import { ValuesForDataFeeds } from "@redstone-finance/sdk";

// TODO: rewrite this file, as now we even support getting values from smart contract for MentoAdapter
export const getValuesForDataFeeds = async (
  priceFeedsAdapterContract: Contract,
  dataFeeds: string[]
): Promise<ValuesForDataFeeds> => {
  // We do not support getting latest values from smart contract for MentoAdapter
  if (config().adapterContractType === "mento") {
    return {};
  }

  const dataFeedsAsBytes32 = dataFeeds.map(utils.formatBytes32String);
  const valuesFromContractAsBigNumber =
    await priceFeedsAdapterContract.getValuesForDataFeeds(dataFeedsAsBytes32);
  const dataFeedsValues: ValuesForDataFeeds = {};
  for (const [index, dataFeedId] of dataFeeds.entries()) {
    const currentValue = valuesFromContractAsBigNumber[index];

    dataFeedsValues[dataFeedId] = currentValue;
  }
  return dataFeedsValues;
};
