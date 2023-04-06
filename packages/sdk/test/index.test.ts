import {
  DataPackagesRequestParams,
  getOracleRegistryState,
  requestDataPackages,
  requestRedstonePayload,
} from "../src";
import { mockSignedDataPackages } from "./mocks/mock-packages";
import { server } from "./mocks/server";

const BASE_TIMESTAMP = 1654353405000;
const MAX_ALLOWED_TIMESTAMP_DELAY = 10000;

describe("SDK tests", () => {
  const reqParams: DataPackagesRequestParams = {
    dataFeeds: ["BTC", "ETH"],
    dataServiceId: "mock-data-service-id",
    uniqueSignersCount: 2,
  };

  beforeAll(() => server.listen());

  test("Should properly get oracle registry state", async () => {
    const state = await getOracleRegistryState();
    expect(Object.keys(state.dataServices).length).toBe(8);
    expect(state.dataServices).toHaveProperty("redstone-stocks-demo");
  });

  test("Should properly request data packages", async () => {
    const dataPackages = await requestDataPackages(reqParams);
    expect(mockSignedDataPackages.ETH[0]).toMatchObject(
      dataPackages["ETH"][0].toObj()
    );
  });

  test("Should properly request redstone payload", async () => {
    const redstonePayload = await requestRedstonePayload(reqParams);
    expect(redstonePayload).toBe(
      "4254430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001d1a94a20004554480000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000174876e80001812f2590c000000020000002357e7277f0acf07cd574d721acce7db8ea12b2dee7f4a2b93aef6903a4b91933344708211a51630344be4957dbf398a98381f35132804c1652a8f5e55a5744121c4254430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001d1a94a20004554480000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000174876e80001812f2590c000000020000002357e7277f0acf07cd574d721acce7db8ea12b2dee7f4a2b93aef6903a4b91933344708211a51630344be4957dbf398a98381f35132804c1652a8f5e55a5744121c4254430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001d1a94a20004554480000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000174876e80001812f2590c000000020000002357e7277f0acf07cd574d721acce7db8ea12b2dee7f4a2b93aef6903a4b91933344708211a51630344be4957dbf398a98381f35132804c1652a8f5e55a5744121c4254430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001d1a94a20004554480000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000174876e80001812f2590c000000020000002357e7277f0acf07cd574d721acce7db8ea12b2dee7f4a2b93aef6903a4b91933344708211a51630344be4957dbf398a98381f35132804c1652a8f5e55a5744121c0004000000000002ed57011e0000"
    );
  });

  test("Should not fail if not all urls fail", async () => {
    const dataPackages = await requestDataPackages(reqParams, [
      "https://bad-url-1.com",
      "https://bad-url-2.com",
      "https://good-url-1.com",
    ]);
    expect(mockSignedDataPackages.ETH[0]).toMatchObject(
      dataPackages["ETH"][0].toObj()
    );
  });

  test("Should select the newest data packages", async () => {
    const dataPackages = await requestDataPackages(
      {
        ...reqParams,
        dataFeeds: ["ETH"],
        uniqueSignersCount: 1,
      },
      ["https://good-url-sorted-asc-only-eth.com"]
    );
    const dataPackage = dataPackages.ETH[0].dataPackage;
    expect(dataPackage.timestampMilliseconds).toBe(11);
  });

  test("Should fail if all urls fail", async () => {
    await expect(
      requestDataPackages(reqParams, [
        "https://bad-url-1.com",
        "https://bad-url-2.com",
      ])
    ).rejects.toThrow(
      `Request failed {\"reqParams\":{\"dataFeeds\":[\"BTC\",\"ETH\"],\"dataServiceId\":\"mock-data-service-id\",\"uniqueSignersCount\":2},\"urls\":[\"https://bad-url-1.com\",\"https://bad-url-2.com\"]}, Original error: All promises were rejected: 0: Request failed with status code 400, 1: Request failed with status code 400, `
    );
  });

  test("Should fail for missing data feed id", async () => {
    await expect(() =>
      requestDataPackages(reqParams, [
        "https://good-url-sorted-asc-only-eth.com",
      ])
    ).rejects.toThrow(
      "Requested data feed id is not included in response: BTC"
    );
  });

  test("Should fail for too few unique signers", async () => {
    await expect(() =>
      requestDataPackages({
        ...reqParams,
        uniqueSignersCount: 3,
      })
    ).rejects.toThrow(
      "Too few unique signers for the data feed: BTC. Expected: 3. Received: 2"
    );
  });

  test("Should fail for outdated data package", async () => {
    jest
      .useFakeTimers()
      .setSystemTime(BASE_TIMESTAMP + MAX_ALLOWED_TIMESTAMP_DELAY + 1);

    await expect(() =>
      requestDataPackages({
        ...reqParams,
        maxTimestampDelay: MAX_ALLOWED_TIMESTAMP_DELAY,
      })
    ).rejects.toThrow(
      "At least one datapackage is outdated. Current timestamp: 1654353415001. Outdated datapackages timestamps: [1654353400000,1654353400000]"
    );
  });

  test("Should fetch data packages with valid timestamp", async () => {
    jest.useFakeTimers().setSystemTime(BASE_TIMESTAMP);

    const dataPackages = await requestDataPackages({
      ...reqParams,
      maxTimestampDelay: MAX_ALLOWED_TIMESTAMP_DELAY,
    });
    expect(mockSignedDataPackages.ETH[0]).toMatchObject(
      dataPackages["ETH"][0].toObj()
    );
  });
});
