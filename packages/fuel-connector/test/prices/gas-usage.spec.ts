import { ContractParamsProvider } from "@redstone-finance/sdk";
import { BigNumberish } from "ethers";
import { sleep } from "fuels";
import { IS_CI, provider } from "../common/provider";
import { readProxyContractId } from "../common/read-proxy-contract-id";
import { connectPricesContract } from "./prices-contract-test-utils";

jest.setTimeout(10 * 60000);

describe("Gas Usage of integrated and initialized prices contract", () => {
  it("gas usage tests", async () => {
    if (IS_CI) {
      return console.log("Skipping in CI env");
    }

    await performGasUsageTests(1, ["ETH", "BTC", "AVAX"]);
    await waitForNewData();
    await performGasUsageTests(4, ["ETH", "BTC", "AVAX"]);

    // c + m * p = a_m
    // c + n * p = a_n,
    // so... p = (a_n - a_m) / (n - m), c = a_n - n * p

    for (const obj of [
      { func: "get_prices", num: 12, subject: "packages" },
      { func: "write_prices", num: 12, subject: "packages" },
      { func: "read_prices", num: 4, subject: "feeds" },
      { func: "read_timestamp", num: 12, subject: "packages" },
    ]) {
      const maxGasUsage = results[`${obj.func}:4:3`];
      const minGasUsage = results[`${obj.func}:1:3`];

      const perSubject = Math.round(
        (maxGasUsage - minGasUsage) / (obj.num - 3)
      );
      const perSubjectConst = minGasUsage - perSubject * 3;

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
    const adapter = await (
      await connectPricesContract(readProxyContractId(), true, await provider())
    ).getAdapter();
    const paramsProvider = new ContractParamsProvider({
      dataServiceId: "redstone-primary-prod",
      uniqueSignersCount: uniqueSignerCount,
      dataPackagesIds: dataFeeds,
    });

    let gasUsage = await adapter.getPricesFromPayload(paramsProvider);
    logAndSaveResults(
      "get_prices",
      uniqueSignerCount,
      dataFeeds,
      Number(gasUsage[0])
    );

    gasUsage = (await adapter.writePricesFromPayloadToContract(
      paramsProvider
    )) as number[];
    logAndSaveResults(
      "write_prices",
      uniqueSignerCount,
      dataFeeds,
      Number(gasUsage[0])
    );

    gasUsage = (await adapter.readPricesFromContract(
      paramsProvider
    )) as number[];
    logAndSaveResults(
      "read_prices",
      uniqueSignerCount,
      dataFeeds,
      Number(gasUsage[0])
    );

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
    gasUsage: BigNumberish
  ) {
    console.log(
      `Gas usage for ${method}, ${uniqueSignerCount} signer(s), ${
        dataFeeds.length
      } feed(s): ${Number(gasUsage)}`
    );

    results[`${method}:${uniqueSignerCount}:${dataFeeds.length}`] =
      Number(gasUsage);
  }

  async function waitForNewData() {
    for (let i = 0; i < 6; i++) {
      console.log(`waiting for new data... (${5 * (6 - i)} sec. to go)`);
      await sleep(5000);
    }
  }
});
