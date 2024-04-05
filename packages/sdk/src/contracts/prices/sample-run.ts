import { BigNumber, BigNumberish } from "ethers";
import { ContractParamsProvider } from "../ContractParamsProvider";
import { IContractConnector } from "../IContractConnector";
import { IPriceFeedContractAdapter } from "./IPriceFeedContractAdapter";
import { IPricesContractAdapter } from "./IPricesContractAdapter";

/* eslint-disable @typescript-eslint/restrict-template-expressions */

export async function sampleRun(
  paramsProvider: ContractParamsProvider,
  pricesConnector: IContractConnector<IPricesContractAdapter>,
  ethFeedConnector: IContractConnector<IPriceFeedContractAdapter>,
  refreshStateCallback = async () => {}
) {
  const pricesAdapter = await pricesConnector.getAdapter();
  const coreValues = await pricesAdapter.getPricesFromPayload(paramsProvider);
  console.log(`Core values: ${coreValues}`);

  const deployHash = (await pricesAdapter.writePricesFromPayloadToContract(
    paramsProvider
  )) as string;

  await pricesConnector.waitForTransaction(deployHash);

  await refreshStateCallback();
  console.log(`Block number: ${await pricesConnector.getBlockNumber()}`);

  const values = await pricesAdapter.readPricesFromContract(paramsProvider);

  console.log(`Values read from contract: ${values.map(convertValue)}`);
  console.log(
    `Timestamp read from contract: ${await pricesAdapter.readTimestampFromContract()}`
  );

  const feedAdapter = await ethFeedConnector.getAdapter();

  const { value, timestamp } = await feedAdapter.getPriceAndTimestamp();

  console.log(
    `ETH price: $${convertValue(value)} - ${
      (Date.now() - timestamp) / 1000
    } s. ago`
  );
}

function convertValue(v: BigNumberish) {
  return BigNumber.from(v).toNumber() / 10 ** 8;
}
