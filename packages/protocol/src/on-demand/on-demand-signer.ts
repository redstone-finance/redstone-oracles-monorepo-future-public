import { DataPackage } from "../data-package/DataPackage";
import { NumericDataPoint } from "../data-point/NumericDataPoint";

export const signOnDemandDataPackage = (
  address: string,
  score: number,
  timestamp: number,
  privateKey: string
) => {
  const dataPoint = new NumericDataPoint({
    dataFeedId: address,
    value: score,
    decimals: 0,
  });

  const dataPackage = new DataPackage([dataPoint], timestamp, address);
  return dataPackage.sign(privateKey);
};

export const prepareMessageToSign = (timestamp: number) => {
  const utcDate = new Date(timestamp).toUTCString();
  return `Allow verification of my account on ${utcDate}`;
};
