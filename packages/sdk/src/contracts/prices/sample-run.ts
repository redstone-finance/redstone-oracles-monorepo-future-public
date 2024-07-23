import { BigNumber, BigNumberish } from "ethers";
import { ContractParamsProvider } from "../ContractParamsProvider";
import { IContractConnector } from "../IContractConnector";
import { IPriceFeedContractAdapter } from "./IPriceFeedContractAdapter";
import { IPricesContractAdapter } from "./IPricesContractAdapter";

/* eslint-disable @typescript-eslint/restrict-template-expressions */

export async function sampleRun(
  paramsProvider: ContractParamsProvider,
  pricesConnector: IContractConnector<IPricesContractAdapter>,
  ethFeedConnector?: IContractConnector<IPriceFeedContractAdapter>,
  refreshStateCallback = async () => {}
) {
  const pricesAdapter = await pricesConnector.getAdapter();
  const coreValues = await pricesAdapter.getPricesFromPayload(paramsProvider);
  console.log(`Core values: ${coreValues.map(convertValue)}`);

  const deployHash = (await pricesAdapter.writePricesFromPayloadToContract(
    paramsProvider
  )) as string;

  await pricesConnector.waitForTransaction(deployHash);
  console.log(`Values written to contract with ${deployHash}`);

  await refreshStateCallback();
  console.log(`Block number: ${await pricesConnector.getBlockNumber()}`);

  const values = await pricesAdapter.readPricesFromContract(paramsProvider);

  console.log(`Values read from contract: ${values.map(convertValue)}`);
  const readTimestamp = await pricesAdapter.readTimestampFromContract();
  console.log(
    `Timestamp read from contract: ${readTimestamp} (${describeTimestamp(readTimestamp)})`
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
