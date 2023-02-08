import { Contract } from "ethers";
import { formatBytes32String } from "ethers/lib/utils";
import { WrapperBuilder } from "../../src";

export const getWrappedContract = (contract: Contract, timestamp: number) => {
  return WrapperBuilder.wrap(contract).usingSimpleNumericMock({
    mockSignersCount: 10,
    dataPoints: [
      { dataFeedId: "BTC", value: 23077.68 },
      { dataFeedId: "ETH", value: 1670.99 },
    ],
    timestampMilliseconds: timestamp,
  });
};

export const addDataFeedsToRegistry = async (registryContract: Contract) => {
  const firstDataFeedIdToAdd = formatBytes32String("ETH");
  const secondDataFeedIdToAdd = formatBytes32String("BTC");
  await registryContract.addDataFeed(firstDataFeedIdToAdd);
  await registryContract.addDataFeed(secondDataFeedIdToAdd);
};
