import { ContractParamsProvider } from "@redstone-finance/sdk";
import { BigNumber, BigNumberish } from "ethers";
import fs from "fs";
import path from "node:path";

const DATA_SERVICE_ID = "redstone-avalanche-prod";
const DATA_FEEDS = ["ETH", "BTC", "AVAX"];
const UNIQUE_SIGNER_COUNT = 3;
export const RELAY_ADAPTER_ADDRESS = readDeployedHex("price_relay_adapter");
export const ADAPTER_ADDRESS = readDeployedHex("price_adapter");
export const FEED_ADDRESS = readDeployedHex("price_feed");

export function makeContractParamsProvider(
  dataFeeds = DATA_FEEDS,
  uniqueSignerCount = UNIQUE_SIGNER_COUNT
) {
  return new ContractParamsProvider({
    dataServiceId: DATA_SERVICE_ID,
    uniqueSignersCount: uniqueSignerCount,
    dataPackagesIds: dataFeeds,
  });
}

export function readDeployedHex(contractName: string) {
  return fs
    .readFileSync(
      path.join(__dirname, `../../rust/contracts/${contractName}/DEPLOYED.hex`),
      "utf8"
    )
    .trim();
}

function verifyUsdtValue(value: BigNumberish) {
  const usdtPrice = BigNumber.from(value).toNumber();

  expect(usdtPrice).toBeLessThanOrEqual(1.02 * 10 ** 8);
  expect(usdtPrice).toBeGreaterThanOrEqual(0.98 * 10 ** 8);
}

function verifyTimestamp(timestamp: number | undefined) {
  if (timestamp) {
    expect(timestamp).toBeGreaterThanOrEqual(Date.now() - 2 * 60 * 1000);
  }
}

export function verifyReturnedValues(
  values: BigNumberish[],
  expectedLength: number,
  timestamp?: number
) {
  expect(values.length).toBe(expectedLength);
  verifyUsdtValue(values[2]);
  verifyTimestamp(timestamp);
}
