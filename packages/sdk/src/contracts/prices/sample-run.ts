import { BigNumber, BigNumberish } from "ethers";
import { ContractParamsProvider } from "../ContractParamsProvider";
import { IContractConnector } from "../IContractConnector";
import { IPriceFeedContractAdapter } from "./IPriceFeedContractAdapter";
import {
  IExtendedPricesContractAdapter,
  IPricesContractAdapter,
} from "./IPricesContractAdapter";

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
    console.log(`Values pushed to contract: ${deployHash}`);
  }

  await refreshStateCallback();

  console.log(
    `Current block number: ${await pricesConnector.getBlockNumber()}`
  );

  logHeader("Reading values from component state...");
  const values = await pricesAdapter.readPricesFromContract(paramsProvider);

  console.log(`Values read from contract: ${values.map(convertValue)}`);
  const readTimestamp = await pricesAdapter.readTimestampFromContract();
  console.log(
    `Timestamp read from contract: ${readTimestamp} (${describeTimestamp(readTimestamp)})`
  );

  if (isExtendedPricesContractAdapter(pricesAdapter)) {
    const lastUpdateBlockTimestamp =
      await pricesAdapter.readLatestUpdateBlockTimestamp();
    console.log(
      `Last update block timestamp: ${lastUpdateBlockTimestamp} (${describeTimestamp(lastUpdateBlockTimestamp!)})`
    );

    const uniqueSignerThreshold =
      await pricesAdapter.getUniqueSignerThreshold();
    console.log(`Unique signer count: ${uniqueSignerThreshold}`);
  }

  if (!ethFeedConnector) {
    return;
  }

  const feedAdapter = await ethFeedConnector.getAdapter();

  const { value, timestamp } = await feedAdapter.getPriceAndTimestamp();

  console.log(
    `ETH price: $${convertValue(value)} (${describeTimestamp(timestamp)})`
  );
}

export function convertValue(v: BigNumberish) {
  return BigNumber.from(v).toNumber() / 10 ** 8;
}

export function describeTimestamp(timestamp: number) {
  return `${(Date.now() - timestamp) / 1000} sec. ago`;
}

export function isExtendedPricesContractAdapter(
  priceAdapter: unknown
): priceAdapter is IExtendedPricesContractAdapter {
  const adapter = priceAdapter as IExtendedPricesContractAdapter;

  return (
    typeof adapter.getUniqueSignerThreshold === "function" &&
    typeof adapter.readLatestUpdateBlockTimestamp === "function"
  );
}
