import { RedstoneCommon } from "@redstone-finance/utils";
import { BigNumber, BigNumberish } from "ethers";
import { ContractData } from "../ContractData";
import { ContractParamsProvider } from "../ContractParamsProvider";
import { IContractConnector } from "../IContractConnector";
import { IPriceFeedContractAdapter } from "./IPriceFeedContractAdapter";
import {
  IExtendedPricesContractAdapter,
  IMultiFeedPricesContractAdapter,
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
  try {
    const coreValues = await pricesAdapter.getPricesFromPayload(paramsProvider);
    console.log(`Core values: ${coreValues.map(convertValue)}`);
  } catch (e) {
    console.error(RedstoneCommon.stringifyError(e));
  }

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

  logHeader("Reading values from contract state...");
  const values = await pricesAdapter.readPricesFromContract(paramsProvider);

  console.log(`Values read from contract: ${values.map(convertValue)}`);
  const readTimestamp = await pricesAdapter.readTimestampFromContract(
    paramsProvider.getDataFeedIds()[0]
  );
  console.log(
    `Timestamp read from contract: ${readTimestamp} (${describeTimestamp(readTimestamp)})`
  );

  if (isMultiFeedContractAdapter(pricesAdapter)) {
    console.log(
      `Price data: \n${describeContractData(
        await pricesAdapter.readContractData(paramsProvider.getDataFeedIds())
      )}`
    );
  }

  if (isExtendedPricesContractAdapter(pricesAdapter)) {
    const lastUpdateBlockTimestamp =
      await pricesAdapter.readLatestUpdateBlockTimestamp(
        paramsProvider.getDataFeedIds()[0]
      );
    console.log(
      `Last update block timestamp: ${lastUpdateBlockTimestamp} (${describeTimestamp(lastUpdateBlockTimestamp!)})`
    );

    const uniqueSignerThreshold =
      await pricesAdapter.getUniqueSignerThreshold();
    console.log(`Unique signer count: ${uniqueSignerThreshold}`);
  }

  if (!ethFeedConnector) {
    return logHeader("FINISHING");
  }

  logHeader("Reading data from ETH PriceFeed");

  const feedAdapter = await ethFeedConnector.getAdapter();
  const { value, timestamp } = await feedAdapter.getPriceAndTimestamp();

  console.log(
    `ETH price: $${convertValue(value)} (${describeTimestamp(timestamp)})`
  );

  logHeader("FINISHING");
}

export function convertValue(v: BigNumberish) {
  return BigNumber.from(v).toNumber() / 10 ** 8;
}

export function describeTimestamp(timestamp: number) {
  return `${(Date.now() - timestamp) / 1000} sec. ago`;
}

export function describeContractData(data: ContractData) {
  return Object.entries(data)
    .map(
      ([key, value]) =>
        `${key}: ${convertValue(value.lastValue)} of ${describeTimestamp(value.lastDataPackageTimestampMS)} / block: ${describeTimestamp(value.lastBlockTimestampMS)}`
    )
    .join("\n");
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

export function isMultiFeedContractAdapter(
  priceAdapter: unknown
): priceAdapter is IMultiFeedPricesContractAdapter {
  const adapter = priceAdapter as IMultiFeedPricesContractAdapter;

  return typeof adapter.readContractData === "function";
}
