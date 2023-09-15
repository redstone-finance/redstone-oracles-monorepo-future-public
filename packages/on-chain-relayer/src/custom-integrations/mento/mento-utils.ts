import { BigNumber } from "ethers";
import { ISortedOracles, MentoAdapterBase } from "../../../typechain-types";

export interface MentoContracts {
  mentoAdapter: MentoAdapterBase;
  wrapContract(mentoAdapter: MentoAdapterBase): MentoAdapterBase;
  sortedOracles: ISortedOracles;
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const addressesAreEqual = (addr1: string, addr2: string) => {
  return addr1.toLowerCase() === addr2.toLowerCase();
};

const safelyGetAddressOrZero = (
  oracleAddresses: string[],
  uncheckedIndex: number,
) => {
  return uncheckedIndex < 0 || uncheckedIndex > oracleAddresses.length - 1
    ? ZERO_ADDRESS
    : oracleAddresses[uncheckedIndex];
};

export const calculateLinkedListPosition = (
  rates: [string[], BigNumber[], number[]],
  valueToInsert: BigNumber,
  oracleAddress: string,
) => {
  // We need to copy the arrays for being able to filter out current oracle later
  const oracleAddresses = [...rates[0]];
  const oracleValues = [...rates[1]];

  // Removing current oracle values
  const indexOfCurrentOracle = oracleAddresses.findIndex((elem) =>
    addressesAreEqual(oracleAddress, elem),
  );
  if (indexOfCurrentOracle > -1) {
    const numberOfItemsToRemove = 1;
    oracleAddresses.splice(indexOfCurrentOracle, numberOfItemsToRemove);
    oracleValues.splice(indexOfCurrentOracle, numberOfItemsToRemove);
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

export const prepareLinkedListLocationsForMentoAdapterReport = async ({
  mentoAdapter,
  wrapContract,
  sortedOracles,
}: MentoContracts) => {
  const dataFeeds = await mentoAdapter.getDataFeeds();
  const dataFeedIds = dataFeeds.map((df) => df.dataFeedId);
  const locationsInSortedLinkedLists = [];

  // Calculating proposed oracle values
  const wrappedContract = wrapContract(mentoAdapter.connect(ZERO_ADDRESS));
  const proposedValuesNormalized =
    await wrappedContract.getNormalizedOracleValuesFromTxCalldata(dataFeedIds);

  // Fetching current values and oracle addresses
  const ratesPerToken = await Promise.all(
    dataFeeds.map((df) => sortedOracles.getRates(df.tokenAddress)),
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
    );
    locationsInSortedLinkedLists.push(locationInSortedLinkedList);
  }

  return locationsInSortedLinkedLists;
};
