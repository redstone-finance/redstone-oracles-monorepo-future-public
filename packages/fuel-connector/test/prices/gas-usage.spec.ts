import { Provider } from "fuels";
import { ContractParamsProvider } from "redstone-sdk";
import { connectPricesContract } from "./prices-contract-test-utils";

jest.setTimeout(10 * 60000);

const IS_LOCAL = 1;

// 	For the beta-2 node the 'fuels' version must not be greater than 0.32.0
const provider = IS_LOCAL
  ? undefined
  : new Provider("https://beta-3.fuel.network/graphql");

describe("Gas Usage of integrated and initialized prices contract", () => {
  it("write_prices should write the price data that can be read then", async () => {
    await performGasUsageTests(1, ["ETH"]);
    await performGasUsageTests(4, ["ETH", "BTC", "AVAX"]);

    // c + p = a_1
    // c + n * p = a_n,
    // so... p = (a_n - a_1) / ( n - 1), c = a_1 - p

    for (let obj of [
      { func: "get_prices", num: 12, subject: "packages" },
      { func: "write_prices", num: 12, subject: "packages" },
      { func: "read_prices", num: 4, subject: "feeds" },
      { func: "read_timestamp", num: 12, subject: "packages" },
    ]) {
      const maxGasUsage = results[`${obj.func}:4:3`];
      const minGasUsage = results[`${obj.func}:1:1`];

      const perSubject = Math.round(
        (maxGasUsage - minGasUsage) / (obj.num - 1)
      );
      const perSubjectConst = minGasUsage - perSubject;

      console.log(
        `${obj.func} costs: ${perSubjectConst} + ${perSubject} * #${obj.subject}`
      );
    }
  });

  const results: { [invocation: string]: number } = {};

  async function performGasUsageTests(
    uniqueSignerCount: number,
    dataFeeds: string[]
  ) {
    const adapter = await connectPricesContract(provider, true);
    const paramsProvider = new ContractParamsProvider({
      dataServiceId: "redstone-avalanche-prod",
      uniqueSignersCount: uniqueSignerCount,
      dataFeeds: dataFeeds,
    });

    let gasUsage = await adapter.getPricesFromPayload(paramsProvider);
    logAndSaveResults("get_prices", uniqueSignerCount, dataFeeds, gasUsage[0]);

    gasUsage = (await adapter.writePricesFromPayloadToContract(
      paramsProvider
    )) as number[];
    logAndSaveResults(
      "write_prices",
      uniqueSignerCount,
      dataFeeds,
      gasUsage[0]
    );

    gasUsage = (await adapter.readPricesFromContract(
      paramsProvider
    )) as number[];
    logAndSaveResults("read_prices", uniqueSignerCount, dataFeeds, gasUsage[0]);

    const timestampGasUsage = await adapter.readTimestampFromContract();
    logAndSaveResults(
      "read_timestamp",
      uniqueSignerCount,
      dataFeeds,
      timestampGasUsage
    );
  }

  function logAndSaveResults(
    method: string,
    uniqueSignerCount: number,
    dataFeeds: string[],
    gasUsage: number
  ) {
    console.log(
      `Gas usage for ${method}, ${uniqueSignerCount} signer(s), ${dataFeeds.length} feed(s): ${gasUsage}`
    );

    results[`${method}:${uniqueSignerCount}:${dataFeeds.length}`] = gasUsage;
  }
});
