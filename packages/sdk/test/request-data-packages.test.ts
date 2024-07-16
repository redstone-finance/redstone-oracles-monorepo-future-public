import { DataPackage } from "@redstone-finance/protocol";
import axios from "axios";
import { ethers } from "ethers";
import {
  DataPackagesRequestParams,
  requestDataPackages,
  requestRedstonePayload,
} from "../src";
import { mockSignedDataPackages } from "./mocks/mock-packages";
import { server } from "./mocks/server";

const MOCK_WALLET = ethers.Wallet.createRandom();

const getReqParams = (urls?: string[]): DataPackagesRequestParams => {
  return {
    dataPackagesIds: ["BTC", "ETH"],
    dataServiceId: "mock-data-service-tests",
    uniqueSignersCount: 2,
    urls: urls!,
  };
};
const SAMPLE_RESPONSE = {
  data: {
    ETH: [
      {
        dataPoints: [{ dataFeedId: "BTC", value: 20000 }],
        timestampMilliseconds: 1654353400000,
        dataServiceId: "service-1",
        signature:
          "NX5yd/Cs8HzVdNchrM59uOoSst7n9KK5Ou9pA6S5GTM0RwghGlFjA0S+SVfb85ipg4HzUTKATBZSqPXlWldEEhw=",
        dataFeedId: "ETH",
        dataPackageId: "ETH",
        signerAddress: "0x2",
      },
    ],
  },
};

describe("request-data-packages", () => {
  beforeAll(() => server.listen());
  beforeEach(() => jest.restoreAllMocks());

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
      /Request failed with status code 400/
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

  test("Should get two data packages closest to median", async () => {
    const dataPackages = await requestDataPackages({
      ...getReqParams(),
      dataPackagesIds: ["ETH"],
    });

    expect(dataPackages["ETH"]!.length).toBe(2);
    expect(dataPackages["ETH"]![0].toObj().dataPoints[0].value).toBe(1000);
    expect(dataPackages["ETH"]![1].toObj().dataPoints[0].value).toBe(1000);
  });

  test("Should get single data packages closest to median", async () => {
    const dataPackages = await requestDataPackages({
      ...getReqParams(),
      uniqueSignersCount: 1,
      dataPackagesIds: ["ETH"],
    });

    expect(dataPackages["ETH"]!.length).toBe(1);
    expect(dataPackages["ETH"]![0].toObj().dataPoints[0].value).toBe(1000);
  });

  test("Should get all data packages", async () => {
    const dataPackages = await requestDataPackages({
      ...getReqParams(),
      uniqueSignersCount: 4,
      dataPackagesIds: ["ETH"],
    });

    expect(dataPackages["ETH"]!.length).toBe(4);
    expect(dataPackages["ETH"]![0].toObj().dataPoints[0].value).toBe(1000);
    expect(dataPackages["ETH"]![1].toObj().dataPoints[0].value).toBe(1000);
    expect(dataPackages["ETH"]![2].toObj().dataPoints[0].value).toBe(1002);
    expect(dataPackages["ETH"]![3].toObj().dataPoints[0].value).toBe(990);
  });

  test("Should get the most fresh data-packages", async () => {
    const axiosGetSpy = jest.spyOn(axios, "get");
    axiosGetSpy.mockResolvedValueOnce({
      data: {
        ETH: [
          {
            dataPoints: [{ dataFeedId: "ETH", value: 1000 }],
            timestampMilliseconds: 1654353400000 + 69,
            signature:
              "NX5yd/Cs8HzVdNchrM59uOoSst7n9KK5Ou9pA6S5GTM0RwghGlFjA0S+SVfb85ipg4HzUTKATBZSqPXlWldEEhw=",
            dataServiceId: "service-1",
            dataFeedId: "ETH",
            dataPackageId: "ETH",
            signerAddress: "0x2",
          },
        ],
      },
    });
    axiosGetSpy.mockResolvedValueOnce({
      data: {
        ETH: [
          {
            dataPoints: [{ dataFeedId: "ETH", value: 1000 }],
            timestampMilliseconds: 1654353400000 + 420,
            signature:
              "NX5yd/Cs8HzVdNchrM59uOoSst7n9KK5Ou9pA6S5GTM0RwghGlFjA0S+SVfb85ipg4HzUTKATBZSqPXlWldEEhw=",
            dataServiceId: "service-1",
            dataFeedId: "ETH",
            dataPackageId: "ETH",
            signerAddress: "0x2",
          },
        ],
      },
    });
    axiosGetSpy.mockResolvedValueOnce({
      data: {
        ETH: [
          {
            dataPoints: [{ dataFeedId: "ETH", value: 1000 }],
            timestampMilliseconds: 1654353400000,
            signature:
              "NX5yd/Cs8HzVdNchrM59uOoSst7n9KK5Ou9pA6S5GTM0RwghGlFjA0S+SVfb85ipg4HzUTKATBZSqPXlWldEEhw=",
            dataServiceId: "service-1",
            dataFeedId: "ETH",
            dataPackageId: "ETH",
            signerAddress: "0x2",
          },
        ],
      },
    });

    const dataPackages = await requestDataPackages({
      ...getReqParams(),
      urls: ["1", "2"],
      uniqueSignersCount: 1,
      dataPackagesIds: ["ETH"],
    });

    expect(dataPackages["ETH"]![0].dataPackage.timestampMilliseconds).toBe(
      1654353400000 + 420
    );
  });

  test("Should omit packages with deviated timestamp", async () => {
    const axiosGetSpy = jest.spyOn(axios, "get");
    const now = Date.now();
    const dataPackage = DataPackage.fromObj({
      dataPoints: [{ dataFeedId: "ETH", value: 20000 }],
      timestampMilliseconds: now,
      dataPackageId: "ETH",
    }).sign(MOCK_WALLET.privateKey);

    axiosGetSpy.mockResolvedValue({
      data: {
        ETH: [
          {
            dataPoints: [{ dataFeedId: "ETH", value: 20000 }],
            timestampMilliseconds: now,
            dataServiceId: "service-1",
            dataFeedId: "ETH",
            dataPackageId: "ETH",
            signerAddress: "0x2",
            signature: dataPackage.toObj().signature,
          },
          {
            dataPoints: [{ dataFeedId: "ETH", value: 10000 }],
            timestampMilliseconds: now - 30_000,
            dataServiceId: "service-1",
            dataFeedId: "ETH",
            dataPackageId: "ETH",
            signerAddress: "0x3",
            signature: dataPackage.toObj().signature,
          },
        ],
      },
    });

    await expect(
      requestDataPackages({
        ...getReqParams(),
        uniqueSignersCount: 2,
        dataPackagesIds: ["ETH"],
        maxTimestampDeviationMS: 20_000,
      })
    ).rejects.toThrowError(/Too few unique signers/);

    const result = await requestDataPackages({
      ...getReqParams(),
      uniqueSignersCount: 1,
      dataPackagesIds: ["ETH"],
      maxTimestampDeviationMS: 20_000,
    });

    expect(result["ETH"]![0].dataPackage.dataPoints[0].toObj().value).toEqual(
      20_000
    );
  });

  test("Should omit packages signed by not authorized", async () => {
    const axiosGetSpy = jest.spyOn(axios, "get");
    const dataPackage = DataPackage.fromObj({
      dataPoints: [{ dataFeedId: "BTC", value: 20000 }],
      timestampMilliseconds: 1654353400000,
      dataPackageId: "BTC",
    }).sign(MOCK_WALLET.privateKey);

    axiosGetSpy.mockResolvedValueOnce({
      data: {
        ETH: [
          {
            dataPoints: [{ dataFeedId: "BTC", value: 20000 }],
            timestampMilliseconds: 1654353400000,
            dataServiceId: "service-1",
            dataFeedId: "ETH",
            dataPackageId: "ETH",
            signerAddress: "0x2",
            signature: dataPackage.toObj().signature,
          },
        ],
      },
    });

    await expect(
      requestDataPackages({
        ...getReqParams(),
        uniqueSignersCount: 1,
        dataPackagesIds: ["ETH"],
        authorizedSigners: ["fake_signer"],
      })
    ).rejects.toThrowError(/Too few unique signers/);
  });

  test("Should omit packages signed by not authorized signers, but pass through correctly signed", async () => {
    const axiosGetSpy = jest.spyOn(axios, "get");
    const signedDataPackageByAuthorizedSigner = DataPackage.fromObj({
      dataPoints: [{ dataFeedId: "BTC", value: 20000 }],
      timestampMilliseconds: 1654353400000,
      dataPackageId: "BTC",
    }).sign(MOCK_WALLET.privateKey);

    const mockWallet2 = ethers.Wallet.createRandom();
    const signedDataPackageByNOTAuthorizedSigner = DataPackage.fromObj({
      dataPoints: [{ dataFeedId: "BTC", value: 30000 }],
      timestampMilliseconds: 1654353400000,
      dataPackageId: "BTC",
    }).sign(mockWallet2.privateKey);

    axiosGetSpy.mockResolvedValue({
      data: {
        ETH: [
          {
            dataPoints: [{ dataFeedId: "BTC", value: 20000 }],
            timestampMilliseconds: 1654353400000,
            dataServiceId: "service-1",
            dataFeedId: "ETH",
            dataPackageId: "ETH",
            signerAddress: "0x2",
            signature: signedDataPackageByAuthorizedSigner.toObj().signature,
          },
          {
            dataPoints: [{ dataFeedId: "BTC", value: 40000 }],
            timestampMilliseconds: 1654353400000,
            dataServiceId: "service-1",
            dataFeedId: "ETH",
            dataPackageId: "ETH",
            signerAddress: "0x2",
            // invalid signature should be also rejected
            signature: "0x0",
          },
          {
            dataPoints: [{ dataFeedId: "BTC", value: 30000 }],
            timestampMilliseconds: 1654353400000,
            dataServiceId: "service-1",
            dataFeedId: "ETH",
            dataPackageId: "ETH",
            signerAddress: "0x2",
            signature: signedDataPackageByNOTAuthorizedSigner.toObj().signature,
          },
        ],
      },
    });
    const result = await requestDataPackages({
      ...getReqParams(),
      uniqueSignersCount: 1,
      dataPackagesIds: ["ETH"],
      authorizedSigners: [MOCK_WALLET.address],
    });

    expect(result["ETH"]![0].dataPackage.dataPoints[0].toObj().value).toEqual(
      20_000
    );

    await expect(
      requestDataPackages({
        ...getReqParams(),
        uniqueSignersCount: 2,
        dataPackagesIds: ["ETH"],
        authorizedSigners: [MOCK_WALLET.address],
      })
    ).rejects.toThrowError(/Too few unique signers/);
  });

  test("Should reject when payload does not follow schema", async () => {
    const axiosGetSpy = jest.spyOn(axios, "get");
    // missing signature
    axiosGetSpy.mockResolvedValueOnce({
      data: {
        ETH: [
          {
            dataPoints: [{ dataFeedId: "BTC", value: 20000 }],
            timestampMilliseconds: 1654353400000,
            dataServiceId: "service-1",
            dataFeedId: "ETH",
            dataPackageId: "ETH",
            signerAddress: "0x2",
          },
        ],
      },
    });

    await expect(
      requestDataPackages({
        ...getReqParams(),
        uniqueSignersCount: 4,
        dataPackagesIds: ["ETH"],
      })
    ).rejects.toThrowError(/Zod validation error/);
  });

  describe("requestDataPackages time handling", () => {
    beforeAll(() => {
      jest.useFakeTimers();
    });
    afterAll(() => {
      jest.useRealTimers();
    });

    it("three gateways respond immediately with successes", async () => {
      const axiosGetSpy = jest.spyOn(axios, "get");
      axiosGetSpy.mockResolvedValue(SAMPLE_RESPONSE);

      const start = performance.now();
      await requestDataPackages({
        ...getReqParams(),
        urls: ["1", "2", "3"],
        uniqueSignersCount: 1,
        dataPackagesIds: ["ETH"],
      });

      const timePassed = performance.now() - start;
      expect(timePassed).toBe(0);
    });

    it("two gateways respond immediately with successes one fails immediately", async () => {
      const axiosGetSpy = jest.spyOn(axios, "get");
      axiosGetSpy
        .mockRejectedValueOnce(new Error("gw error"))
        .mockResolvedValueOnce(SAMPLE_RESPONSE)
        .mockResolvedValueOnce(SAMPLE_RESPONSE);

      const start = performance.now();
      await requestDataPackages({
        ...getReqParams(),
        urls: ["1", "2", "3"],
        uniqueSignersCount: 1,
        dataPackagesIds: ["ETH"],
      });

      const timePassed = performance.now() - start;
      expect(timePassed).toBe(0);
    });

    it("two gateways respond immediately one timeouts", async () => {
      const axiosGetSpy = jest.spyOn(axios, "get");
      axiosGetSpy
        .mockImplementationOnce(
          () => new Promise((_, reject) => setTimeout(reject, 20_000))
        )
        .mockImplementationOnce(() => Promise.resolve(SAMPLE_RESPONSE))
        .mockImplementationOnce(() => Promise.resolve(SAMPLE_RESPONSE));

      const start = performance.now();
      void jest.advanceTimersByTimeAsync(650);
      await requestDataPackages({
        ...getReqParams(),
        urls: ["1", "2", "3"],
        uniqueSignersCount: 1,
        dataPackagesIds: ["ETH"],
      });

      const timePassed = performance.now() - start;
      expect(timePassed).toBe(500);
    });

    it("two gateways timeouts one respond", async () => {
      const axiosGetSpy = jest.spyOn(axios, "get");
      axiosGetSpy
        .mockResolvedValueOnce(SAMPLE_RESPONSE)
        .mockImplementationOnce(
          () => new Promise((_, reject) => setTimeout(reject, 20_000))
        )
        .mockImplementationOnce(
          () => new Promise((_, reject) => setTimeout(reject, 20_000))
        );

      const start = performance.now();
      void jest.advanceTimersByTimeAsync(650);
      await requestDataPackages({
        ...getReqParams(),
        urls: ["1", "2", "3"],
        uniqueSignersCount: 1,
        dataPackagesIds: ["ETH"],
      });

      const timePassed = performance.now() - start;
      expect(timePassed).toBe(500);
    });

    it("three gateways timeout", async () => {
      const axiosGetSpy = jest.spyOn(axios, "get");
      axiosGetSpy.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), 20_000)
          )
      );

      const start = performance.now();
      void jest.advanceTimersByTimeAsync(21_000);
      const packagesPromise = requestDataPackages({
        ...getReqParams(),
        urls: ["1", "2", "3"],
        uniqueSignersCount: 1,
        dataPackagesIds: ["ETH"],
      });

      await expect(packagesPromise).rejects.toThrowError(/timeout/);
      const timePassed = performance.now() - start;
      expect(timePassed).toBe(20_000);
    });

    it("two gateways timeout last respond after wait for all gateways", async () => {
      const axiosGetSpy = jest.spyOn(axios, "get");

      axiosGetSpy
        .mockImplementationOnce(
          () =>
            new Promise((resolve, _) =>
              setTimeout(() => resolve(SAMPLE_RESPONSE), 20_000)
            )
        )
        .mockImplementationOnce(
          () =>
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("timeout")), 20_000)
            )
        )
        .mockImplementationOnce(
          () =>
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("timeout")), 20_000)
            )
        );

      const start = performance.now();
      void jest.advanceTimersByTimeAsync(21_000);
      await requestDataPackages({
        ...getReqParams(),
        urls: ["1", "2", "3"],
        uniqueSignersCount: 1,
        dataPackagesIds: ["ETH"],
      });

      const timePassed = performance.now() - start;
      expect(timePassed).toBe(20_000);
    });
  });
});
