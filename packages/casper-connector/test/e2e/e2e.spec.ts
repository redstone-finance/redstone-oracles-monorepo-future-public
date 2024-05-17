import { BigNumber } from "ethers";
import {
  makeCasperConnection,
  PriceAdapterCasperContractAdapter,
  PriceAdapterCasperContractConnector,
  PriceRelayAdapterCasperContractAdapter,
  PriceRelayAdapterCasperContractConnector,
} from "../../src";
import { ICasperConnection } from "../../src/casper/ICasperConnection";
import { PriceFeedCasperContractAdapter } from "../../src/contracts/price_feed/PriceFeedCasperContractAdapter";
import { PriceFeedCasperContractConnector } from "../../src/contracts/price_feed/PriceFeedCasperContractConnector";
import {
  ADAPTER_ADDRESS,
  FEED_ADDRESS,
  makeContractParamsProvider,
  RELAY_ADAPTER_ADDRESS,
  verifyReturnedValues,
} from "./e2e-utils";

jest.setTimeout(120_000);

// That test-suite is skipped by default; it can be run only locally
describe.skip("E2E tests", () => {
  let connection: ICasperConnection;
  let pricesConnector: PriceAdapterCasperContractConnector;
  let pricesAdapter: PriceAdapterCasperContractAdapter;
  let priceRelayConnector: PriceRelayAdapterCasperContractConnector;
  let pricesRelayAdapter: PriceRelayAdapterCasperContractAdapter;
  let priceFeedConnector: PriceFeedCasperContractConnector;
  let priceFeedAdapter: PriceFeedCasperContractAdapter;

  beforeAll(async () => {
    const { config } = await import("./config");
    connection = await makeCasperConnection(config);

    pricesConnector = new PriceAdapterCasperContractConnector(
      connection,
      ADAPTER_ADDRESS
    );
    pricesAdapter =
      (await pricesConnector.getAdapter()) as PriceAdapterCasperContractAdapter;

    priceRelayConnector = new PriceRelayAdapterCasperContractConnector(
      connection,
      RELAY_ADAPTER_ADDRESS
    );
    pricesRelayAdapter =
      (await priceRelayConnector.getAdapter()) as PriceRelayAdapterCasperContractAdapter;

    priceFeedConnector = new PriceFeedCasperContractConnector(
      connection,
      FEED_ADDRESS
    );
    priceFeedAdapter = await priceFeedConnector.getAdapter();
  });

  it("PriceRelayAdapter.getPricesFromPayload should return prices", async () => {
    const paramsProvider = makeContractParamsProvider(
      ["ETH", "BTC", "USDT"],
      1
    );
    const values =
      await pricesRelayAdapter.getPricesFromPayload(paramsProvider);
    verifyReturnedValues(
      values,
      paramsProvider.requestParams.dataPackagesIds.length
    );
  });

  it("PriceRelayAdapter.writePricesFromPayload should write prices that can be read", async () => {
    await testWritePrices(pricesRelayAdapter, 3);
  });

  // That test is skipped by default; it can consume a lot of CSPR
  it.skip("PriceRelayAdapter.writePricesFromPayload should write prices that can be read, extreme unique signer count", async () => {
    await testWritePrices(pricesRelayAdapter, 5);
  });

  it("PriceAdapter.writePricesFromPayload should write prices that can be read", async () => {
    await testWritePrices(pricesAdapter);
  });

  async function testWritePrices(
    performingAdapter: PriceAdapterCasperContractAdapter,
    uniqueSignerCount = 1
  ) {
    const paramsProvider = makeContractParamsProvider(
      ["ETH", "BTC", "USDT"],
      uniqueSignerCount
    );
    const deployId = (await performingAdapter.writePricesFromPayloadToContract(
      paramsProvider
    )) as string;
    await performingAdapter.assertWaitForDeployAndRefreshStateRootHash(
      deployId
    );

    const values = await pricesAdapter.readPricesFromContract(paramsProvider);
    const timestamp = await pricesAdapter.readTimestampFromContract();

    verifyReturnedValues(
      values,
      paramsProvider.requestParams.dataPackagesIds.length,
      timestamp
    );

    const { timestamp: feedTimestamp, value: ethValue } =
      await priceFeedAdapter.getPriceAndTimestamp();

    expect(feedTimestamp).toBe(timestamp);
    expect(BigNumber.from(ethValue).toNumber()).toBe(
      BigNumber.from(values[0]).toNumber()
    );
  }
});
