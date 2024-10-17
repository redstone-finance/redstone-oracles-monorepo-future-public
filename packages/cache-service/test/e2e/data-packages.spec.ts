/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import {
  DataPoint,
  SignedDataPackagePlainObj,
  consts,
} from "@redstone-finance/protocol";
import request from "supertest";
import { AppModule } from "../../src/app.module";
import {
  DataPackage,
  DataPackageDocument,
} from "../../src/data-packages/data-packages.model";
import { DataPackagesService } from "../../src/data-packages/data-packages.service";
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
import {
  createTestDB as createAndConnectToTestDb,
  dropTestDatabase,
} from "../common/test-db";
import { signByMockSigner } from "../common/test-utils";

type WithSigner = { signerAddress: string };

jest.mock("@redstone-finance/sdk", () => ({
  __esModule: true,
  ...jest.requireActual("@redstone-finance/sdk"),
  getOracleRegistryState: jest.fn(() => mockOracleRegistryState),
}));

const ALL_FEEDS_KEY = consts.ALL_FEEDS_KEY;
const dataPackagesIds = [ALL_FEEDS_KEY, "ETH", "AAVE", "BTC"];

const getExpectedDataPackagesInDB = (
  dataPackages: SignedDataPackagePlainObj[]
) =>
  dataPackages.map((dataPackage) => ({
    ...dataPackage,
    signerAddress: mockSigner.address,
    dataServiceId: MOCK_DATA_SERVICE_ID,
    isSignatureValid: true,
    dataFeedId: ALL_FEEDS_KEY,
    dataPackageId: ALL_FEEDS_KEY,
  }));

const mockSigners = [MOCK_SIGNER_ADDRESS, "0x2", "0x3", "0x4", "0x5"];

describe("Data packages (e2e)", () => {
  let app: INestApplication, httpServer: unknown;
  let mockDataPackages: SignedDataPackagePlainObj[];

  beforeEach(async () => {
    // Connect to mongoDB in memory
    await createAndConnectToTestDb();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    mockDataPackages = getMockDataPackages();
    app = moduleFixture.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer();

    // Adding test data to DB
    const dataPackagesToInsert = [];
    const mockDataPackage = mockDataPackages[0];
    for (const dataServiceId of [
      "service-1",
      "service-2",
      "service-3",
      "mock-data-service-1",
      "mock-data-service-2",
    ]) {
      for (const timestampMilliseconds of [
        mockDataPackage.timestampMilliseconds - 1000,
        mockDataPackage.timestampMilliseconds,
      ]) {
        for (const dataPackageId of dataPackagesIds) {
          for (const signerAddress of mockSigners) {
            dataPackagesToInsert.push({
              ...mockDataPackage,
              timestampMilliseconds,
              isSignatureValid: true,
              dataFeedId: dataPackageId,
              dataPackageId,
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
      produceMockDataPackage(
        [
          new DataPoint("BTC", Buffer.from("3000", "utf-8")),
          new DataPoint("ETH", Buffer.from("1000", "utf-8")),
        ],
        "___ALL_FEEDS___"
      ),
    ];
    const requestSignature = signByMockSigner(dataPackagesToSent);

    await request(httpServer)
      .post("/data-packages/bulk")
      .send({ requestSignature, dataPackages: dataPackagesToSent })
      .expect(201);

    const dataPackagesInDB = await DataPackage.find().sort({
      dataPackageId: 1,
    });
    const dataPackagesInDBCleaned = dataPackagesInDB.map((dp) => {
      const { _id, __v, ...rest } = dp.toJSON() as any;
      // temporary for backward compatibility

      rest.dataFeedId = rest.dataPackageId;
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
      dataPackageId: 1,
    });
    const dataPackagesInDBCleaned = dataPackagesInDB.map((dp) => {
      const { _id, __v, ...rest } = dp.toJSON() as any;
      // temporary for backward compatibility

      rest.dataFeedId = rest.dataPackageId;
      return rest;
    });
    expect(dataPackagesInDBCleaned).toEqual(
      expect.arrayContaining(getExpectedDataPackagesInDB(mockDataPackages))
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
        dataPackageId: "BTC",
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

  it("/data-packages/latest (GET) return package which contains more UNIQUE data-packages (in this case older one) ", async () => {
    const mockDataPackage = mockDataPackages[0];
    await DataPackage.insertMany([
      {
        ...mockDataPackage,
        timestampMilliseconds: mockDataPackage.timestampMilliseconds,
        isSignatureValid: true,
        dataFeedId: "BTC",
        dataPackageId: "BTC",
        dataServiceId: "mock-data-service-1",
        signerAddress: "0x2",
      },
      {
        ...mockDataPackage,
        timestampMilliseconds: mockDataPackage.timestampMilliseconds,
        isSignatureValid: true,
        dataFeedId: "ETH",
        dataPackageId: "ETH",
        dataServiceId: "mock-data-service-1",
        signerAddress: "0x2",
      },
      {
        ...mockDataPackage,
        timestampMilliseconds: mockDataPackage.timestampMilliseconds - 1000,
        isSignatureValid: true,
        dataFeedId: "BTC",
        dataPackageId: "BTC",
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
    const manipulatedDataPackages = getMockDataPackages();
    const requestSignature = signByMockSigner(manipulatedDataPackages);
    manipulatedDataPackages[0].dataPoints[0].value = 43;
    await request(httpServer)
      .post("/data-packages/bulk")
      .send({
        requestSignature,
        dataPackages: manipulatedDataPackages,
      })
      .expect(500);

    expect(await DataPackage.countDocuments()).toEqual(initialDpCount);
  });

  it("/data-packages/latest/mock-data-service-1 (GET)", async () => {
    const dpTimestamp = mockDataPackages[0].timestampMilliseconds;
    jest.spyOn(Date, "now").mockImplementation(() => dpTimestamp);
    const testResponse = await request(httpServer)
      .get("/data-packages/latest/mock-data-service-1")
      .expect(200);

    for (const dataPackageId of dataPackagesIds) {
      expect(testResponse.body[dataPackageId].length).toBe(5);
      const signers = [];
      for (const dataPackage of testResponse.body[dataPackageId]) {
        expect(dataPackage).toHaveProperty("dataFeedId", dataPackageId);
        expect(dataPackage).toHaveProperty("dataPackageId", dataPackageId);
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

    for (const dataPackageId of dataPackagesIds) {
      expect(testResponse.body[dataPackageId][0].timestampMilliseconds).toBe(
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

  it("/data-packages/latest/ (GET) - should throw 513 if empty data package response", async () => {
    await DataPackage.deleteMany({});
    const dpTimestamp = mockDataPackages[0].timestampMilliseconds;
    jest.spyOn(Date, "now").mockImplementation(() => dpTimestamp);
    const response = await request(httpServer)
      .get("/data-packages/latest/mock-data-service-1")
      .expect(513);
    expect(response.body.message).toBe("Data packages response is empty");
  });

  it("/data-packages/stats (GET) - should work properly with a valid api key", async () => {
    // Sending request for stats
    const mockDataPackage = mockDataPackages[0];
    await DataPackage.insertMany([
      {
        ...mockDataPackage,
        timestampMilliseconds: Date.now(),
        isSignatureValid: true,
        dataFeedId: "BTC",
        dataPackageId: "BTC",
        dataServiceId: "mock-data-service-1",
        signerAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      },
      {
        ...mockDataPackage,
        timestampMilliseconds: Date.now(),
        isSignatureValid: true,
        dataFeedId: "BTC",
        dataPackageId: "BTC",
        dataServiceId: "mock-data-service-1",
        signerAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      },
    ]);

    const response = await request(httpServer)
      .get(`/data-packages/stats/${7200 * 1000}`)
      .query({
        "api-key": "test-api-key",
      })
      .expect(200);

    // Response validation
    expect(response.body).toEqual(
      expect.objectContaining({
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266": {
          dataServiceId: "mock-data-service-1",
          verifiedDataPackagesCount: 2,
          nodeName: "Mock node 1",
        },
      })
    );
  });

  it("/data-packages/stats (GET) - should fail for an invalid api key", async () => {
    await request(httpServer)
      .get("/data-packages/stats/1")
      .send({ "api-key": "2" })
      .expect(400);

    await request(httpServer)
      .get("/data-packages/stats/1")
      .query({
        "api-key": "invalid-api-key",
      })
      .expect(401);
  });

  describe("cache", () => {
    it("/data-packages/latest (GET) - should serve cached result", async () => {
      const dpTimestamp = mockDataPackages[0].timestampMilliseconds;
      jest.spyOn(Date, "now").mockImplementation(() => dpTimestamp);

      const dataPackageService = app.get(DataPackagesService);

      const getLatestSpy = jest.spyOn(
        dataPackageService,
        "getLatestDataPackagesFromDbWithSameTimestamp"
      );
      const firstRequest = request(httpServer)
        .get("/data-packages/latest/mock-data-service-1")
        .expect(200);

      const secondConcurrentRequest = request(httpServer)
        .get("/data-packages/latest/mock-data-service-1")
        .expect(200);

      await Promise.all([firstRequest, secondConcurrentRequest]);
      expect(getLatestSpy).toBeCalledTimes(1);

      await request(httpServer)
        .get("/data-packages/latest/mock-data-service-1")
        .expect(200);

      expect(getLatestSpy).toBeCalledTimes(1);
    });

    it("/data-packages/latest (GET) - should be called twice for different data-service-id", async () => {
      const dpTimestamp = mockDataPackages[0].timestampMilliseconds;
      jest.spyOn(Date, "now").mockImplementation(() => dpTimestamp);

      const dataPackageService = app.get(DataPackagesService);

      const getLatestSpy = jest.spyOn(
        dataPackageService,
        "getLatestDataPackagesFromDbWithSameTimestamp"
      );
      const firstRequest = request(httpServer)
        .get("/data-packages/latest/mock-data-service-1")
        .expect(200);

      const secondConcurrentRequest = request(httpServer)
        .get("/data-packages/latest/mock-data-service-2")
        .expect(200);

      await Promise.all([firstRequest, secondConcurrentRequest]);
      expect(getLatestSpy).toBeCalledTimes(2);

      await request(httpServer)
        .get("/data-packages/latest/mock-data-service-1")
        .expect(200);

      expect(getLatestSpy).toBeCalledTimes(2);
    });
  });
});
