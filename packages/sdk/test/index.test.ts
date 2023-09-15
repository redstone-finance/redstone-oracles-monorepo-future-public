import { utils } from "ethers";
import {
  DataPackagesRequestParams,
  getOracleRegistryState,
  requestDataPackages,
  requestRedstonePayload,
} from "../src";
import { mockSignedDataPackages } from "./mocks/mock-packages";
import { server } from "./mocks/server";

const getReqParams = (urls?: string[]): DataPackagesRequestParams => {
  return {
    dataFeeds: ["BTC", "ETH"],
    dataServiceId: "mock-data-service-tests",
    uniqueSignersCount: 2,
    urls: urls!,
  };
};

describe("SDK tests", () => {
  beforeAll(() => server.listen());

  test("Should properly get oracle registry state", async () => {
    const state = await getOracleRegistryState();
    expect(Object.keys(state.dataServices).length).toBeGreaterThanOrEqual(9);
    expect(state.dataServices).toHaveProperty("redstone-stocks-demo");
  });

  test("Should properly request data packages", async () => {
    const dataPackages = await requestDataPackages(getReqParams());
    expect(mockSignedDataPackages.ETH[0]).toMatchObject(
      dataPackages["ETH"]![0].toObj()
    );
  });

  test("Should properly request redstone payload", async () => {
    const redstonePayload = await requestRedstonePayload(getReqParams());
    expect(redstonePayload).toBe(
      "4254430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001d1a94a20004554480000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000174876e80001812f2590c000000020000002357e7277f0acf07cd574d721acce7db8ea12b2dee7f4a2b93aef6903a4b91933344708211a51630344be4957dbf398a98381f35132804c1652a8f5e55a5744121c4254430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001d1a94a20004554480000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000174876e80001812f2590c000000020000002357e7277f0acf07cd574d721acce7db8ea12b2dee7f4a2b93aef6903a4b91933344708211a51630344be4957dbf398a98381f35132804c1652a8f5e55a5744121c4254430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001d1a94a20004554480000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000174876e80001812f2590c000000020000002357e7277f0acf07cd574d721acce7db8ea12b2dee7f4a2b93aef6903a4b91933344708211a51630344be4957dbf398a98381f35132804c1652a8f5e55a5744121c4254430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001d1a94a20004554480000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000174876e80001812f2590c000000020000002357e7277f0acf07cd574d721acce7db8ea12b2dee7f4a2b93aef6903a4b91933344708211a51630344be4957dbf398a98381f35132804c1652a8f5e55a5744121c0004000000000002ed57011e0000"
    );
  });

  test("Should not fail if not all urls fail", async () => {
    const defaultReqParams = getReqParams([
      "https://bad-url-1.com",
      "https://bad-url-2.com",
      "https://good-url-1.com",
    ]);
    const dataPackages = await requestDataPackages(defaultReqParams);
    expect(mockSignedDataPackages.ETH[0]).toMatchObject(
      dataPackages["ETH"]![0].toObj()
    );
  });

  test("Should fail if all urls fail", async () => {
    const defaultReqParams = getReqParams([
      "https://bad-url-1.com",
      "https://bad-url-2.com",
    ]);
    await expect(requestDataPackages(defaultReqParams)).rejects.toThrow(
      'Request failed {"reqParams":{"dataFeeds":["BTC","ETH"],"dataServiceId":"mock-data-service-tests","uniqueSignersCount":2,"urls":["https://bad-url-1.com","https://bad-url-2.com"]}}, Original error: All promises were rejected: 0: Request failed with status code 400, 1: Request failed with status code 400, '
    );
  });

  test("Should fail for missing data feed id", async () => {
    const defaultReqParams = getReqParams([
      "https://good-url-sorted-asc-only-eth.com",
    ]);
    await expect(() => requestDataPackages(defaultReqParams)).rejects.toThrow(
      "Requested data feed id is not included in response: BTC"
    );
  });

  test("Should fail for too few unique signers", async () => {
    await expect(() =>
      requestDataPackages({
        ...getReqParams(),
        uniqueSignersCount: 5,
      })
    ).rejects.toThrow(
      "Too few unique signers for the data feed: BTC. Expected: 5. Received: 4"
    );
  });

  test("Should get data packages with biggest deviation", async () => {
    const dataPackages = await requestDataPackages({
      ...getReqParams(),
      dataFeeds: ["ETH"],
      valuesToCompare: { ETH: utils.parseUnits("999", 8) },
    });

    expect(dataPackages["ETH"]!.length).toBe(2);
    expect(dataPackages["ETH"]![0].toObj().dataPoints[0].value).toBe(990);
    expect(dataPackages["ETH"]![1].toObj().dataPoints[0].value).toBe(1002);
  });

  test("Should get single data package with biggest deviation", async () => {
    const dataPackages = await requestDataPackages({
      ...getReqParams(),
      uniqueSignersCount: 1,
      dataFeeds: ["ETH"],
      valuesToCompare: { ETH: utils.parseUnits("991", 8) },
    });

    expect(dataPackages["ETH"]!.length).toBe(1);
    expect(dataPackages["ETH"]![0].toObj().dataPoints[0].value).toBe(1002);
  });

  test("Should get all data packages with biggest deviation", async () => {
    const dataPackages = await requestDataPackages({
      ...getReqParams(),
      uniqueSignersCount: 4,
      dataFeeds: ["ETH"],
      valuesToCompare: { ETH: utils.parseUnits("996", 8) },
    });

    expect(dataPackages["ETH"]!.length).toBe(4);
    expect(dataPackages["ETH"]![0].toObj().dataPoints[0].value).toBe(990);
    expect(dataPackages["ETH"]![1].toObj().dataPoints[0].value).toBe(1002);
    expect(dataPackages["ETH"]![2].toObj().dataPoints[0].value).toBe(1000);
    expect(dataPackages["ETH"]![3].toObj().dataPoints[0].value).toBe(1000);
  });
});
