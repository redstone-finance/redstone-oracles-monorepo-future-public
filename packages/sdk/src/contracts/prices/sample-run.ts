import { BigNumber, BigNumberish } from "ethers";
import { ContractParamsProvider } from "../ContractParamsProvider";
import { IContractConnector } from "../IContractConnector";
import { IPriceFeedContractAdapter } from "./IPriceFeedContractAdapter";
import { IPricesContractAdapter } from "./IPricesContractAdapter";

/* eslint-disable @typescript-eslint/restrict-template-expressions */

function logHeader(text: string, lineSize = 80) {
  console.log("");
  console.log("=".repeat(lineSize));
  console.log(text.toUpperCase());
  console.log("-".repeat(lineSize));
}

export async function sampleRun(
  paramsProvider: ContractParamsProvider,
  pricesConnector: IContractConnector<IPricesContractAdapter>,
  ethFeedConnector?: IContractConnector<IPriceFeedContractAdapter>,
  refreshStateCallback = async () => {}
) {
  const pricesAdapter = await pricesConnector.getAdapter();

  logHeader("Taking values using core model");
  const coreValues = await pricesAdapter.getPricesFromPayload(paramsProvider);
  console.log(`Core values: ${coreValues.map(convertValue)}`);

  logHeader("Pushing values using classic model");
  const deployHash =
    await pricesAdapter.writePricesFromPayloadToContract(paramsProvider);

  if (typeof deployHash == "string") {
    await pricesConnector.waitForTransaction(deployHash);
  } else {
    console.log(`Values pushed to component: ${deployHash}`);
  }

  await refreshStateCallback();

  console.log(
    `Current block number: ${await pricesConnector.getBlockNumber()}`
  );

  logHeader("Reading values from component state...");
  const values = await pricesAdapter.readPricesFromContract(paramsProvider);
  console.log(`Values read from component: ${values.map(convertValue)}`);
  const readTimestamp = await pricesAdapter.readTimestampFromContract();
  console.log(
    `Timestamp read from component: ${readTimestamp} (${describeTimestamp(readTimestamp)})`
  );

  if (!ethFeedConnector) {
    return;
  }

  const feedAdapter = await ethFeedConnector.getAdapter();

  const { value, timestamp } = await feedAdapter.getPriceAndTimestamp();

  console.log(
    `ETH price: $${convertValue(value)} (${describeTimestamp(timestamp)})`
  );
}

function convertValue(v: BigNumberish) {
  return BigNumber.from(v).toNumber() / 10 ** 8;
}

function describeTimestamp(timestamp: number) {
  return `${(Date.now() - timestamp) / 1000} sec. ago`;
}
