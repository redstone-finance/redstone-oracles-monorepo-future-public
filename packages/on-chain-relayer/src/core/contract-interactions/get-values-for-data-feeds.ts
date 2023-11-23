import { ValuesForDataFeeds } from "@redstone-finance/sdk";
import { utils } from "ethers";
import { IRedstoneAdapter, MentoAdapterBase } from "../../../typechain-types";
import { config } from "../../config";
import { getValuesForMentoDataFeeds } from "../../custom-integrations/mento/mento-utils";
import { getSortedOraclesContractAtAddress } from "./get-contract";

export const getValuesForDataFeeds = async (
  priceFeedsAdapter: IRedstoneAdapter,
  dataFeeds: string[]
): Promise<ValuesForDataFeeds> => {
  switch (config().adapterContractType) {
    case "price-feeds":
      return await getValuesForDataFeedsInPriceFeedsAdapter(
        priceFeedsAdapter,
        dataFeeds
      );
    case "mento":
      return await getValuesForDataFeedsInMentoAdapter(
        priceFeedsAdapter as MentoAdapterBase,
        dataFeeds
      );
    default:
      throw new Error(
        `Unsupported adapter contract type: ${config().adapterContractType}`
      );
  }
};

const getValuesForDataFeedsInPriceFeedsAdapter = async (
  priceFeedsAdapter: IRedstoneAdapter,
  dataFeeds: string[]
): Promise<ValuesForDataFeeds> => {
  const dataFeedsAsBytes32 = dataFeeds.map(utils.formatBytes32String);
  const valuesFromContractAsBigNumber =
    await priceFeedsAdapter.getValuesForDataFeeds(dataFeedsAsBytes32);
  const dataFeedsValues: ValuesForDataFeeds = {};
  for (const [index, dataFeedId] of dataFeeds.entries()) {
    const currentValue = valuesFromContractAsBigNumber[index];

    dataFeedsValues[dataFeedId] = currentValue;
  }
  return dataFeedsValues;
};

const getValuesForDataFeedsInMentoAdapter = async (
  mentoAdapter: MentoAdapterBase,
  dataFeeds: string[]
): Promise<ValuesForDataFeeds> => {
  const sortedOraclesAddress = await mentoAdapter.getSortedOracles();
  return await getValuesForMentoDataFeeds(
    mentoAdapter,
    getSortedOraclesContractAtAddress(sortedOraclesAddress),
    dataFeeds
  );
};
