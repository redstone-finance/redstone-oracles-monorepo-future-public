import "../common/set-test-envs";
import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { ethers } from "ethers";
import { base64 } from "ethers/lib/utils";
import { DataPoint, SignedDataPackagePlainObj } from "redstone-protocol";
import {
  RedstonePayloadParser,
  convertDataPointToNumericDataPoint,
} from "redstone-protocol/dist/src/redstone-payload/RedstonePayloadParser";
import * as request from "supertest";
import { AppModule } from "../../src/app.module";
import { BundlrService } from "../../src/bundlr/bundlr.service";
import { ResponseFormat } from "../../src/data-packages/data-packages.interface";
import {
  CachedDataPackage,
  DataPackage,
  DataPackageDocument,
} from "../../src/data-packages/data-packages.model";
import { ALL_FEEDS_KEY } from "../../src/data-packages/data-packages.service";
import {
  MOCK_DATA_SERVICE_ID,
  MOCK_SIGNATURE,
  MOCK_SIGNER_ADDRESS,
  getMockDataPackages,
  mockDataPackagesForUniqueSigners,
  mockOracleRegistryState,
  mockSigner,
  produceMockDataPackage,
} from "../common/mock-values";
import { connectToTestDB, dropTestDatabase } from "../common/test-db";
import { signByMockSigner } from "../common/test-utils";
import {
  NumberLike,
  convertBytesToNumber,
} from "redstone-protocol/src/common/utils";
import { DEFAULT_NUM_VALUE_DECIMALS } from "redstone-protocol/src/common/redstone-constants";

type WithSigner = { signerAddress: string };

jest.mock("redstone-sdk", () => ({
  __esModule: true,
  ...jest.requireActual("redstone-sdk"),
  getOracleRegistryState: jest.fn(() => mockOracleRegistryState),
}));

const dataFeedIds = [ALL_FEEDS_KEY, "ETH", "AAVE", "BTC"];

const parseDataPointValueToNumber = (
  dataPointValue: NumberLike,
  decimals = DEFAULT_NUM_VALUE_DECIMALS
) =>
  typeof dataPointValue === "string"
    ? convertBytesToNumber(base64.decode(dataPointValue as string)) /
      10 ** decimals
    : dataPointValue;

const getExpectedDataPackagesInDB = (
  dataPackages: SignedDataPackagePlainObj[]
) =>
  dataPackages.map((dataPackage) => ({
    ...dataPackage,
    signerAddress: mockSigner.address,
    dataServiceId: MOCK_DATA_SERVICE_ID,
    isSignatureValid: true,
    dataFeedId: ALL_FEEDS_KEY,
  }));

const mockSigners = [MOCK_SIGNER_ADDRESS, "0x2", "0x3", "0x4", "0x5"];

describe("Data packages (e2e)", () => {
  let app: INestApplication, httpServer: any;
  let bundlrSaveDataPackagesSpy: jest.SpyInstance<
    Promise<void>,
    [dataPackages: CachedDataPackage[]]
  >;
  let mockDataPackages: SignedDataPackagePlainObj[];

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    mockDataPackages = getMockDataPackages();
    app = moduleFixture.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer();

    const bundlrService = app.get(BundlrService);
    bundlrSaveDataPackagesSpy = jest.spyOn(bundlrService, "saveDataPackages");
    bundlrSaveDataPackagesSpy.mockImplementation(() => Promise.resolve());
    bundlrSaveDataPackagesSpy.mockClear();

    // Connect to mongoDB in memory
    await connectToTestDB();

    // Adding test data to DB
    const dataPackagesToInsert = [];
    const mockDataPackage = mockDataPackages[0];
    for (const dataServiceId of [
      "service-1",
      "service-2",
      "service-3",
      "mock-data-service-1",
    ]) {
      for (const timestampMilliseconds of [
        mockDataPackage.timestampMilliseconds - 1000,
        mockDataPackage.timestampMilliseconds,
      ]) {
        for (const dataFeedId of dataFeedIds) {
          for (const signerAddress of mockSigners) {
            dataPackagesToInsert.push({
              ...mockDataPackage,
              timestampMilliseconds,
              isSignatureValid: true,
              dataFeedId,
              dataServiceId,
              signerAddress,
            });
          }
        }
      }
    }

    await DataPackage.insertMany(dataPackagesToInsert);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await dropTestDatabase();
  });

  it("/data-packages/bulk (POST) - should accept data packages where prices are strings", async () => {
    const dataPackagesToSent = [
      produceMockDataPackage([
        new DataPoint("BTC", Buffer.from("3000", "utf-8")),
        new DataPoint("ETH", Buffer.from("1000", "utf-8")),
      ]),
    ];
    const requestSignature = signByMockSigner(dataPackagesToSent);

    await request(httpServer)
      .post("/data-packages/bulk")
      .send({ requestSignature, dataPackages: dataPackagesToSent })
      .expect(201);

    const dataPackagesInDB = await DataPackage.find().sort({
      dataFeedId: 1,
    });
    const dataPackagesInDBCleaned = dataPackagesInDB.map((dp) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _id, __v, ...rest } = dp.toJSON() as any;
      return rest;
    });
    expect(dataPackagesInDBCleaned).toEqual(
      expect.arrayContaining(getExpectedDataPackagesInDB(dataPackagesToSent))
    );
  });

  it("/data-packages/bulk (POST) - should save data to DB", async () => {
    const requestSignature = signByMockSigner(mockDataPackages);
    await request(httpServer)
      .post("/data-packages/bulk")
      .send({
        requestSignature,
        dataPackages: mockDataPackages,
      })
      .expect(201);

    const dataPackagesInDB = await DataPackage.find().sort({
      dataFeedId: 1,
    });
    const dataPackagesInDBCleaned = dataPackagesInDB.map((dp) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _id, __v, ...rest } = dp.toJSON() as any;
      return rest;
    });
    expect(dataPackagesInDBCleaned).toEqual(
      expect.arrayContaining(getExpectedDataPackagesInDB(mockDataPackages))
    );
  });

  it("/data-packages/bulk (POST) - should post data using Bundlr", async () => {
    const requestSignature = signByMockSigner(mockDataPackages);
    await request(httpServer)
      .post("/data-packages/bulk")
      .send({
        requestSignature,
        dataPackages: mockDataPackages,
      })
      .expect(201);

    // Should have been saved in Arweave
    expect(bundlrSaveDataPackagesSpy).toHaveBeenCalledTimes(1);
    expect(bundlrSaveDataPackagesSpy).toHaveBeenCalledWith(
      getExpectedDataPackagesInDB(mockDataPackages)
    );
  });

  it("/data-packages/bulk (POST) - should post data using DB, even if bundlr fails", async () => {
    const requestSignature = signByMockSigner(mockDataPackages);
    // mock bundlr failure
    bundlrSaveDataPackagesSpy.mockImplementationOnce(() => Promise.reject());

    await request(httpServer)
      .post("/data-packages/bulk")
      .send({
        requestSignature,
        dataPackages: mockDataPackages,
      })
      .expect(201);

    const dataPackagesInDB = await DataPackage.find().sort({
      dataFeedId: 1,
    });
    const dataPackagesInDBCleaned = dataPackagesInDB.map((dp) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _id, __v, ...rest } = dp.toJSON() as any;
      return rest;
    });
    expect(dataPackagesInDBCleaned).toEqual(
      expect.arrayContaining(getExpectedDataPackagesInDB(mockDataPackages))
    );
  });

  it("/data-packages/bulk (POST) - should post data using bundlr, even if DB fails", async () => {
    const requestSignature = signByMockSigner(mockDataPackages);
    // mock bundlr DB failure
    const dataPackageSaveManySpy = jest.spyOn(DataPackage, "insertMany");
    dataPackageSaveManySpy.mockImplementationOnce(() => Promise.reject());

    await request(httpServer)
      .post("/data-packages/bulk")
      .send({
        requestSignature,
        dataPackages: mockDataPackages,
      })
      .expect(201);

    expect(bundlrSaveDataPackagesSpy).toHaveBeenCalledTimes(1);
    expect(bundlrSaveDataPackagesSpy).toHaveBeenCalledWith(
      getExpectedDataPackagesInDB(mockDataPackages)
    );
  });

  it("/data-packages/latest (GET) return same result as /data-packages/latest (GET), when same number of dataPackages", async () => {
    const dpTimestamp = mockDataPackages[0].timestampMilliseconds;
    jest.spyOn(Date, "now").mockImplementation(() => dpTimestamp);
    const responseLatest = await request(httpServer)
      .get("/data-packages/latest/mock-data-service-1")
      .expect(200);

    const responseMostRecent = await request(httpServer)
      .get("/data-packages/latest-not-aligned-by-time/mock-data-service-1")
      .expect(200);

    expect(
      responseLatest.body[ALL_FEEDS_KEY].sort((a: WithSigner, b: WithSigner) =>
        a.signerAddress.localeCompare(b.signerAddress)
      )
    ).toEqual(
      responseMostRecent.body[ALL_FEEDS_KEY].sort(
        (a: WithSigner, b: WithSigner) =>
          a.signerAddress.localeCompare(b.signerAddress)
      )
    );
  });

  it("/data-packages/latest (GET) return package which contain more data-packages (in this case older one) ", async () => {
    const mockDataPackage = mockDataPackages[0];
    await DataPackage.insertMany([
      {
        ...mockDataPackage,
        timestampMilliseconds: mockDataPackage.timestampMilliseconds - 1000,
        isSignatureValid: true,
        dataFeedId: "BTC",
        dataServiceId: "mock-data-service-1",
        signerAddress: "0x1",
      },
    ]);
    const dpTimestamp = mockDataPackages[0].timestampMilliseconds;
    jest.spyOn(Date, "now").mockImplementation(() => dpTimestamp);
    const responseLatest = await request(httpServer)
      .get("/data-packages/latest/mock-data-service-1")
      .expect(200);

    expect(responseLatest.body[ALL_FEEDS_KEY][0].timestampMilliseconds).toBe(
      dpTimestamp - 1000
    );
  });

  it("/data-packages/latest (GET) return packages with unique signers if multiple packages with repeated singers", async () => {
    await DataPackage.insertMany(mockDataPackagesForUniqueSigners);

    const dpTimestamp = mockDataPackages[0].timestampMilliseconds;
    jest.spyOn(Date, "now").mockImplementation(() => dpTimestamp);
    const responseLatest = await request(httpServer)
      .get("/data-packages/latest/mock-data-service-1")
      .expect(200);

    expect(responseLatest.body[ALL_FEEDS_KEY].length).toBe(5);
    expect(responseLatest.body.AAVE.length).toBe(5);
    expect(responseLatest.body.ETH.length).toBe(5);
    expect(responseLatest.body.BTC.length).toBe(5);

    const uniqueSignersFromETH = new Set(
      responseLatest.body.ETH.map(
        (dataPackage: DataPackageDocument) => dataPackage.signerAddress
      )
    );
    expect(uniqueSignersFromETH.size).toBe(5);
  });

  it("/data-packages/bulk (POST) - should fail for invalid signature", async () => {
    const initialDpCount = await DataPackage.countDocuments();
    const requestSignature = signByMockSigner(mockDataPackages);
    const newDataPackages = getMockDataPackages();
    newDataPackages[0].dataPoints[0].value = 43;
    await request(httpServer)
      .post("/data-packages/bulk")
      .send({
        requestSignature,
        mockDataPackages,
      })
      .expect(500);

    expect(await DataPackage.countDocuments()).toEqual(initialDpCount);
  });

  it("/data-packages/latest (GET)", async () => {
    const dpTimestamp = mockDataPackages[0].timestampMilliseconds;
    jest.spyOn(Date, "now").mockImplementation(() => dpTimestamp);
    const testResponse = await request(httpServer)
      .get("/data-packages/latest")
      .query({
        "data-service-id": "service-2",
        "unique-signers-count": 4,
        "data-feeds": "ETH,BTC",
      })
      .expect(200);

    for (const dataFeedId of ["BTC", "ETH"]) {
      expect(testResponse.body[dataFeedId].length).toBe(4);
      const signers = [];
      for (const dataPackage of testResponse.body[dataFeedId]) {
        const parsedDataPackage = JSON.parse(dataPackage);
        expect(parsedDataPackage).toHaveProperty("signature", MOCK_SIGNATURE);
        signers.push(parsedDataPackage.signature);
      }
      expect(signers.length).toBe(4);
    }

    // Testing response for the case when there is no data feeds specified
    const testResponse2 = await request(httpServer)
      .get("/data-packages/latest")
      .query({
        "data-service-id": "service-2",
        "unique-signers-count": 4,
      })
      .expect(200);

    const allFeedsDataPackages = testResponse2.body[ALL_FEEDS_KEY];
    const parsedDataPoints = JSON.parse(allFeedsDataPackages[0]).dataPoints;
    expect(allFeedsDataPackages.length).toBe(4);
    expect(parsedDataPoints.length).toBe(3);
    for (const [_, dataPackages] of Object.entries<any>(testResponse2.body)) {
      for (let i = 0; i++; i < dataPackages.length) {
        const dataPackage = JSON.parse(dataPackages[i]);
        expect(dataPackage).toMatchObject(mockDataPackages[0]);
        expect(dataPackage.signerAddress).toEqual(mockSigners[i]);
      }
    }
  });

  it("/data-packages/latest/mock-data-service-1 (GET)", async () => {
    const dpTimestamp = mockDataPackages[0].timestampMilliseconds;
    jest.spyOn(Date, "now").mockImplementation(() => dpTimestamp);
    const testResponse = await request(httpServer)
      .get("/data-packages/latest/mock-data-service-1")
      .expect(200);

    for (const dataFeedId of dataFeedIds) {
      expect(testResponse.body[dataFeedId].length).toBe(5);
      const signers = [];
      for (const dataPackage of testResponse.body[dataFeedId]) {
        expect(dataPackage).toHaveProperty("dataFeedId", dataFeedId);
        expect(dataPackage).toHaveProperty("signature", MOCK_SIGNATURE);
        signers.push(dataPackage.signerAddress);
      }
      expect(signers.length).toBe(5);
      expect(new Set(signers).size).toBe(5);
    }
  });

  it("/data-packages/historical/mock-data-service-1 (GET)", async () => {
    const historicalTimestamp =
      mockDataPackages[0].timestampMilliseconds - 1000;
    const testResponse = await request(httpServer)
      .get(
        `/data-packages/historical/mock-data-service-1/${historicalTimestamp}`
      )
      .expect(200);

    for (const dataFeedId of dataFeedIds) {
      expect(testResponse.body[dataFeedId][0].timestampMilliseconds).toBe(
        historicalTimestamp
      );
    }
    expect(
      testResponse.body[ALL_FEEDS_KEY].sort(
        (a: { signerAddress: string }, b: { signerAddress: string }) =>
          a.signerAddress.localeCompare(b.signerAddress)
      )
    ).toMatchSnapshot("historical-data");
  });

  async function performPayloadTests(
    bytesProvider: (response: request.Response) => Uint8Array,
    format?: ResponseFormat
  ) {
    const testResponse = await request(httpServer)
      .get("/data-packages/payload")
      .query({
        "data-service-id": "service-2",
        "unique-signers-count": 4,
        "data-feeds": "ETH,BTC",
        format,
      })
      .expect(200);

    const expectedStreamLengthWithFeedsSpecified = 2174;
    const expectedDataPackagesCountWithFeedSpecified = 8; // 4 * 2
    verifyPayloadResponse(
      testResponse,
      bytesProvider,
      expectedStreamLengthWithFeedsSpecified,
      expectedDataPackagesCountWithFeedSpecified
    );

    // Testing response for the case when there is no data feeds specified
    const testResponse2 = await request(httpServer)
      .get("/data-packages/payload")
      .query({
        "data-service-id": "service-2",
        "unique-signers-count": 4,
        format,
      })
      .expect(200);

    const expectedStreamLengthForAllFeeds = 1094;
    const expectedDataPackagesCountForAllFeeds = 4;
    verifyPayloadResponse(
      testResponse2,
      bytesProvider,
      expectedStreamLengthForAllFeeds,
      expectedDataPackagesCountForAllFeeds
    );
  }

  function verifyPayloadResponse(
    response: any,
    bytesProvider: (response: request.Response) => Uint8Array,
    expectedStreamLength: number,
    expectedDataPackagesLength: number
  ) {
    const payloadBytes = bytesProvider(response);

    expect(payloadBytes.length).toBe(expectedStreamLength);

    const payload = new RedstonePayloadParser(payloadBytes).parse();
    expect(payload.signedDataPackages.length).toBe(expectedDataPackagesLength);

    const signedDataPackage = payload.signedDataPackages[0];
    const mockDataPackage = mockDataPackages[0];
    expect(base64.encode(signedDataPackage.serializeSignatureToHex())).toBe(
      mockDataPackage.signature
    );
    expect(signedDataPackage.dataPackage.timestampMilliseconds).toBe(
      mockDataPackage.timestampMilliseconds
    );

    const dataPoints: DataPoint[] = signedDataPackage.dataPackage.dataPoints;
    expect(dataPoints.length).toBe(3);
    expect(
      dataPoints.map((dataPoint) =>
        convertDataPointToNumericDataPoint(dataPoint).toObj()
      )
    ).toEqual(
      mockDataPackage.dataPoints.map((dp) => ({
        dataFeedId: dp.dataFeedId,
        value: parseDataPointValueToNumber(dp.value),
      }))
    );
  }

  it("/data-packages/payload (GET) - should return payload in hex format", async () => {
    const dpTimestamp = mockDataPackages[0].timestampMilliseconds;
    jest.spyOn(Date, "now").mockImplementation(() => dpTimestamp);
    await performPayloadTests((response) => {
      return ethers.utils.arrayify(response.text);
    }, "hex");
  });

  it("/data-packages/payload (GET) - should return payload in raw format", async () => {
    const dpTimestamp = mockDataPackages[0].timestampMilliseconds;
    jest.spyOn(Date, "now").mockImplementation(() => dpTimestamp);
    await performPayloadTests((response) => {
      return response.body;
    }, "raw");
  });

  it("/data-packages/payload (GET) - should return payload in bytes format", async () => {
    const dpTimestamp = mockDataPackages[0].timestampMilliseconds;
    jest.spyOn(Date, "now").mockImplementation(() => dpTimestamp);
    await performPayloadTests((response) => {
      return response.body;
    }, "bytes");
  });

  it("/data-packages/payload (GET) - should return payload in raw format when no format is specified", async () => {
    const dpTimestamp = mockDataPackages[0].timestampMilliseconds;
    jest.spyOn(Date, "now").mockImplementation(() => dpTimestamp);
    await performPayloadTests((response) => {
      return response.body;
    });
  });

  it("/data-packages/stats (GET) - should work properly with a valid api key", async () => {
    // Sending request for stats
    const dpTimestamp = mockDataPackages[0].timestampMilliseconds;
    const response = await request(httpServer)
      .get("/data-packages/stats")
      .query({
        "api-key": "test-api-key",
        "from-timestamp": dpTimestamp - 3600 * 1000,
        "to-timestamp": dpTimestamp + 1,
      })
      .expect(200);

    // Response validation
    expect(response.body).toEqual(
      expect.objectContaining({
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266": {
          dataPackagesCount: 32,
          verifiedDataPackagesCount: 32,
          verifiedDataPackagesPercentage: 100,
          nodeName: "Mock node 1",
          dataServiceId: MOCK_DATA_SERVICE_ID,
        },
        "0x2": {
          dataPackagesCount: 32,
          verifiedDataPackagesCount: 32,
          verifiedDataPackagesPercentage: 100,
          nodeName: "unknown",
          dataServiceId: "unknown",
        },
      })
    );
  });

  it("/data-packages/stats (GET) - should fail for an invalid api key", async () => {
    await request(httpServer)
      .get("/data-packages/stats")
      .send({ "from-timestamp": "1", "api-key": "2" })
      .expect(400);

    const response = await request(httpServer)
      .get("/data-packages/stats")
      .query({
        "api-key": "invalid-api-key",
        "from-timestamp": "10",
      })
      .expect(401);
  });
});
