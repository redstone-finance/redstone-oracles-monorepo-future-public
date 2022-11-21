import {
  DataPackagesRequestParams,
  getOracleRegistryState,
  requestDataPackages,
  requestRedstonePayload,
} from "../src";
import { mockSignedDataPackages } from "./mocks/mock-packages";
import { server } from "./mocks/server";

describe("SDK tests", () => {
  const reqParams: DataPackagesRequestParams = {
    dataFeeds: ["BTC", "ETH"],
    dataServiceId: "mock-data-service-id",
    uniqueSignersCount: 4,
  };

  beforeAll(() => server.listen());

  test("Should properly get oracle registry state", async () => {
    const state = await getOracleRegistryState();
    expect(Object.keys(state.dataServices).length).toBe(7);
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
      "https://cache-2.redstone.finance",
    ]);
    expect(mockSignedDataPackages.ETH[0]).toMatchObject(
      dataPackages["ETH"][0].toObj()
    );
  });

  test("Should fail if all urls fail", async () => {
    await expect(
      requestDataPackages(reqParams, [
        "https://bad-url-1.com",
        "https://bad-url-2.com",
      ])
    ).rejects.toEqual(
      new Error(
        `Request failed {"reqParams":{"dataFeeds":["BTC","ETH"],"dataServiceId":"mock-data-service-id","uniqueSignersCount":4},"urls":["https://bad-url-1.com","https://bad-url-2.com"]}, Original error: All promises were rejected: 0: Request failed with status code 400, 1: Request failed with status code 400, `
      )
    );
  });
});
