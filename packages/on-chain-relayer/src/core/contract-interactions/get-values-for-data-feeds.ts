import { Contract, utils } from "ethers";
import { ValuesForDataFeeds } from "../../types";

export const getValuesForDataFeeds = async (
  priceFeedsAdapterContract: Contract,
  dataFeeds: string[]
): Promise<ValuesForDataFeeds> => {
  const dataFeedsAsBytes32 = dataFeeds.map(utils.formatBytes32String);
  const valuesFromContractAsBigNumber =
    await priceFeedsAdapterContract.getValuesForDataFeeds(dataFeedsAsBytes32);
  const dataFeedsValues: ValuesForDataFeeds = {};
  for (const [index, dataFeedId] of dataFeeds.entries()) {
    const currentValue = valuesFromContractAsBigNumber[index];
    dataFeedsValues[dataFeedId] = Number(utils.formatUnits(currentValue, 8));
  }
  return dataFeedsValues;
};
