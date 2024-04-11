import { BlockTag } from "@ethersproject/providers";
import { BaseWrapper } from "@redstone-finance/evm-connector";
import { ValuesForDataFeeds } from "@redstone-finance/sdk";
import { MathUtils, loggerFactory } from "@redstone-finance/utils";
import { BigNumber, ethers } from "ethers";
import { ISortedOracles, MentoAdapterBase } from "../../../typechain-types";

export interface MentoContracts {
  mentoAdapter: MentoAdapterBase;
  dataPackagesWrapper: BaseWrapper<MentoAdapterBase>;
  sortedOracles: ISortedOracles;
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const addressesAreEqual = (addr1: string, addr2: string) => {
  return addr1.toLowerCase() === addr2.toLowerCase();
};

const logger = loggerFactory("mento-utils");

const safelyGetAddressOrZero = (
  oracleAddresses: string[],
  uncheckedIndex: number
) => {
  return uncheckedIndex < 0 || uncheckedIndex > oracleAddresses.length - 1
    ? ZERO_ADDRESS
    : oracleAddresses[uncheckedIndex];
};

export const calculateLinkedListPosition = (
  rates: [string[], BigNumber[], number[]],
  valueToInsert: BigNumber,
  oracleAddress: string,
  maxDeviationAllowedInPercent = Number.MAX_SAFE_INTEGER
) => {
  // We need to copy the arrays for being able to filter out current oracle later
  const oracleAddresses = [...rates[0]];
  const oracleValues = [...rates[1]];

  // Removing current oracle values
  const indexOfCurrentOracle = oracleAddresses.findIndex((elem) =>
    addressesAreEqual(oracleAddress, elem)
  );
  if (indexOfCurrentOracle > -1) {
    const numberOfItemsToRemove = 1;
    oracleAddresses.splice(indexOfCurrentOracle, numberOfItemsToRemove);
    oracleValues.splice(indexOfCurrentOracle, numberOfItemsToRemove);
  }

  if (oracleValues.length) {
    const currentMedian = MathUtils.getMedian(oracleValues);
    const deviation = MathUtils.calculateDeviationPercent({
      baseValue: currentMedian,
      deviatedValue: valueToInsert,
    });
    if (deviation > maxDeviationAllowedInPercent) {
      logger.log(
        `deviation ${deviation} is higher than max acceptable deviation ${maxDeviationAllowedInPercent}. Sorted oracles median price: ${currentMedian}. RedStone price:${valueToInsert.toString()}`
      );
      return undefined;
    }
  }

  // We use a simple O(N) algorithm here, since it's easier to read
  // And we can safely assume that the number of oracles is not large
  // Note! oracleValues are sorted in descending order
  let indexToInsert = oracleValues.length;
  for (let i = 0; i < oracleValues.length; i++) {
    const currentValue = oracleValues[i];
    if (currentValue.lt(valueToInsert)) {
      indexToInsert = i;
      break;
    }
  }

  return {
    lesserKey: safelyGetAddressOrZero(oracleAddresses, indexToInsert),
    greaterKey: safelyGetAddressOrZero(oracleAddresses, indexToInsert - 1),
  };
};

export const prepareLinkedListLocationsForMentoAdapterReport = async (
  { mentoAdapter, dataPackagesWrapper, sortedOracles }: MentoContracts,
  blockTag: number,
  maxDeviationAllowedInPercent?: number
) => {
  const dataFeeds = await mentoAdapter.getDataFeeds({ blockTag });
  const dataFeedIds = dataFeeds.map((df) => df.dataFeedId);
  const locationsInSortedLinkedLists = [];

  // Calculating proposed oracle values
  const wrappedContract = dataPackagesWrapper.overwriteEthersContract(
    mentoAdapter.connect(ZERO_ADDRESS)
  );
  const proposedValuesNormalized =
    await wrappedContract.getNormalizedOracleValuesFromTxCalldata(dataFeedIds, {
      blockTag,
    });

  // Fetching current values and oracle addresses
  const ratesPerToken = await Promise.all(
    dataFeeds.map((df) => sortedOracles.getRates(df.tokenAddress, { blockTag }))
  );

  // Filling the `locationsInSortedLinkedLists` array
  for (
    let dataFeedIndex = 0;
    dataFeedIndex < dataFeeds.length;
    dataFeedIndex++
  ) {
    const locationInSortedLinkedList = calculateLinkedListPosition(
      ratesPerToken[dataFeedIndex],
      proposedValuesNormalized[dataFeedIndex],
      mentoAdapter.address,
      maxDeviationAllowedInPercent
    );
    if (!locationInSortedLinkedList) {
      logger.log(
        `price for ${dataFeeds[dataFeedIndex].dataFeedId} deviates too much`
      );
      return undefined;
    }
    locationsInSortedLinkedLists.push(locationInSortedLinkedList);
  }

  return locationsInSortedLinkedLists;
};

const tokenAddressToValue = async (
  tokenAddress: string,
  sortedOracles: ISortedOracles,
  mentoAdapter: MentoAdapterBase,
  blockTag: BlockTag
) => {
  const rates = await sortedOracles.getRates(tokenAddress, { blockTag });
  const redstoneOracleIndex = rates[0].findIndex((address) =>
    addressesAreEqual(address, mentoAdapter.address)
  );
  if (redstoneOracleIndex == -1) {
    return undefined;
  }
  return rates[1][redstoneOracleIndex].div(BigNumber.from(10).pow(16));
};

const dataFeedToTokenAddress = (
  dataFeedId: string,
  contractFeeds: MentoAdapterBase.DataFeedDetailsStructOutput[]
) => {
  const dataFeedIndex = contractFeeds.findIndex(
    (cf) => ethers.utils.parseBytes32String(cf.dataFeedId) == dataFeedId
  );
  if (dataFeedIndex == -1) {
    throw new Error(`data feed ${dataFeedId} not present in contract`);
  }
  return contractFeeds[dataFeedIndex].tokenAddress;
};

export const getValuesForMentoDataFeeds = async (
  mentoAdapter: MentoAdapterBase,
  sortedOracles: ISortedOracles,
  dataFeeds: string[],
  blockTag: number
): Promise<ValuesForDataFeeds> => {
  const dataFeedsFromContract = await mentoAdapter.getDataFeeds({ blockTag });
  const promises = dataFeeds.map(async (dataFeedId) => {
    const tokenAddress = dataFeedToTokenAddress(
      dataFeedId,
      dataFeedsFromContract
    );
    return [
      dataFeedId,
      await tokenAddressToValue(
        tokenAddress,
        sortedOracles,
        mentoAdapter,
        blockTag
      ),
    ] as const;
  });
  return Object.fromEntries(await Promise.all(promises));
};
