import { BigNumber, BigNumberish } from "ethers";
import {
  CasperConfig,
  PriceRelayAdapterCasperContractConnector,
  makeCasperConnection,
} from "../../src";
import { PriceFeedCasperContractConnector } from "../../src/contracts/price_feed/PriceFeedCasperContractConnector";
import { config } from "./config";
import {
  FEED_ADDRESS,
  RELAY_ADAPTER_ADDRESS,
  makeContractParamsProvider,
} from "./e2e-utils";

async function main(config: CasperConfig) {
  const connection = await makeCasperConnection(config);
  const pricesConnector = new PriceRelayAdapterCasperContractConnector(
    connection,
    RELAY_ADAPTER_ADDRESS
  );
  const pricesAdapter = await pricesConnector.getAdapter();
  const paramsProvider = makeContractParamsProvider();
  let values: BigNumberish[];

  values = await pricesAdapter.getPricesFromPayload(paramsProvider);
  console.log(values);

  const deployHash = (await pricesAdapter.writePricesFromPayloadToContract(
    paramsProvider
  )) as string;

  await pricesConnector.waitForTransaction(deployHash);

  await connection.refreshStateRootHash();
  console.log(await pricesConnector.getBlockNumber());

  // eslint-disable-next-line prefer-const
  values = await pricesAdapter.readPricesFromContract(paramsProvider);

  console.log(values.map((v) => (v as BigNumber).toNumber() / 10 ** 8));
  console.log(await pricesAdapter.readTimestampFromContract());

  const feedAdapter = await new PriceFeedCasperContractConnector(
    connection,
    FEED_ADDRESS
  ).getAdapter();

  const { value, timestamp } = await feedAdapter.getPriceAndTimestamp();

  console.log(
    `ETH: $${(value as BigNumber).toNumber() / 10 ** 8} - ${
      (Date.now() - timestamp) / 1000
    } s. ago`
  );
}

void (async () => {
  await main(config);
})();
