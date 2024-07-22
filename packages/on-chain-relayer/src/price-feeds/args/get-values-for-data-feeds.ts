import { ValuesForDataFeeds } from "@redstone-finance/sdk";
import { utils } from "ethers";
import { IRedstoneAdapter, MentoAdapterBase } from "../../../typechain-types";
import { config } from "../../config";
import { getValuesForMentoDataFeeds } from "../../custom-integrations/mento/mento-utils";

import { getSortedOraclesContractAtAddress } from "../../custom-integrations/mento/get-sorted-oracles-contract-at-address";

export const getValuesForDataFeeds = async (
  priceFeedsAdapter: IRedstoneAdapter,
  dataFeeds: string[],
  blockTag: number
): Promise<ValuesForDataFeeds> => {
  switch (config().adapterContractType) {
    case "price-feeds":
      return await getValuesForDataFeedsInPriceFeedsAdapter(
        priceFeedsAdapter,
        dataFeeds,
        blockTag
      );
    case "mento":
      return await getValuesForDataFeedsInMentoAdapter(
        priceFeedsAdapter as MentoAdapterBase,
        dataFeeds,
        blockTag
      );
    default:
      throw new Error(
        `Unsupported adapter contract type: ${config().adapterContractType}`
      );
  }
};

const getValuesForDataFeedsInPriceFeedsAdapter = async (
  priceFeedsAdapter: IRedstoneAdapter,
  dataFeeds: string[],
  blockTag: number
): Promise<ValuesForDataFeeds> => {
  const dataFeedsAsBytes32 = dataFeeds.map(utils.formatBytes32String);
  const valuesFromContractAsBigNumber =
    await priceFeedsAdapter.getValuesForDataFeeds(dataFeedsAsBytes32, {
      blockTag,
    });
  const dataFeedsValues: ValuesForDataFeeds = {};
  for (const [index, dataFeedId] of dataFeeds.entries()) {
    const currentValue = valuesFromContractAsBigNumber[index];

    dataFeedsValues[dataFeedId] = currentValue;
  }
  return dataFeedsValues;
};

const getValuesForDataFeedsInMentoAdapter = async (
  mentoAdapter: MentoAdapterBase,
  dataFeeds: string[],
  blockTag: number
): Promise<ValuesForDataFeeds> => {
  const sortedOraclesAddress = await mentoAdapter.getSortedOracles({
    blockTag,
  });
  return await getValuesForMentoDataFeeds(
    mentoAdapter,
    getSortedOraclesContractAtAddress(
      sortedOraclesAddress,
      mentoAdapter.provider
    ),
    dataFeeds,
    blockTag
  );
};
