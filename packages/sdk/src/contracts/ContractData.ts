import { BigNumber } from "ethers";
import _ from "lodash";

export type LastRoundDetails = {
  lastDataPackageTimestampMS: number;
  lastBlockTimestampMS: number;
  lastValue: BigNumber;
};

export type ContractData = {
  [dataFeedsId: string]: LastRoundDetails;
};

export function getLastRoundDetails(
  contractData: ContractData,
  dataFeedId: string,
  updateBaseObject = false
): LastRoundDetails {
  let lastRoundDetails = contractData[dataFeedId];
  if (_.isEmpty(lastRoundDetails)) {
    lastRoundDetails = {
      lastBlockTimestampMS: 0,
      lastDataPackageTimestampMS: 0,
      lastValue: BigNumber.from(0),
    };

    if (updateBaseObject) {
      contractData[dataFeedId] = lastRoundDetails;
    }
  }

  return lastRoundDetails;
}
