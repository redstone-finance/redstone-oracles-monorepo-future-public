import "../common/set-test-envs";
import { signByMockSigner } from "../common/test-utils";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../../src/app.module";
import {
  MOCK_SIGNATURE,
  mockDataPackages,
  mockOracleRegistryState,
  mockSigner,
} from "../common/mock-values";
import { connectToTestDB, dropTestDatabase } from "../common/test-db";
import { DataPackage } from "../../src/data-packages/data-packages.model";
import { BundlrService } from "../../src/bundlr/bundlr.service";
import { ALL_FEEDS_KEY } from "../../src/data-packages/data-packages.service";
import { RedstonePayloadParser } from "redstone-protocol/dist/src/redstone-payload/RedstonePayloadParser";
import { ethers } from "ethers";
import { ResponseFormat } from "../../src/data-packages/data-packages.controller";
import { base64 } from "ethers/lib/utils";

jest.mock("redstone-sdk", () => ({
  __esModule: true,
  ...jest.requireActual("redstone-sdk"),
  getOracleRegistryState: jest.fn(() => mockOracleRegistryState),
}));
jest.mock("../../src/bundlr/bundlr.service");

const expectedDataPackages = mockDataPackages.map((dataPackage) => ({
  ...dataPackage,
  signerAddress: mockSigner.address,
  dataServiceId: "mock-data-service-1",
  dataFeedId: "___ALL_FEEDS___",
}));

describe("Data packages (e2e)", () => {
  let app: INestApplication, httpServer: any;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer();

    (BundlrService.prototype.safelySaveDataPackages as any).mockClear();

    // Connect to mongoDB in memory
    await connectToTestDB();

    // Adding test data to DB
    const dataPackagesToInsert = [];
    for (const dataServiceId of ["service-1", "service-2", "service-3"]) {
      for (const dataFeedId of [ALL_FEEDS_KEY, "ETH", "AAVE", "BTC"]) {
        for (const signerAddress of [
          "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // address of mock-signer
          "0x2",
          "0x3",
          "0x4",
          "0x5",
        ]) {
          dataPackagesToInsert.push({
            ...mockDataPackages[0],
            dataFeedId,
            dataServiceId,
            signerAddress,
          });
        }
      }
    }
    await DataPackage.insertMany(dataPackagesToInsert);
  });

  afterEach(async () => await dropTestDatabase());

  it("/data-packages/bulk (POST)", async () => {
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
      expect.arrayContaining(expectedDataPackages)
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
    expect(
      BundlrService.prototype.safelySaveDataPackages
    ).toHaveBeenCalledTimes(1);
    expect(BundlrService.prototype.safelySaveDataPackages).toHaveBeenCalledWith(
      expectedDataPackages
    );
  });

  it("/data-packages/bulk (POST) - should fail for invalid signature", async () => {
    const initialDpCount = await DataPackage.countDocuments();
    const requestSignature = signByMockSigner(mockDataPackages);
    const newDataPackages = [...mockDataPackages];
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
        expect(dataPackage).toHaveProperty("dataFeedId", dataFeedId);
        expect(dataPackage).toHaveProperty("sources", null);
        expect(dataPackage).toHaveProperty("signature", MOCK_SIGNATURE);
        signers.push(dataPackage.signerAddress);
      }
      expect(signers.length).toBe(4);
      expect(new Set(signers).size).toBe(4);
    }

    // Testing response for the case when there is no data feeds specified
    const testResponse2 = await request(httpServer)
      .get("/data-packages/latest")
      .query({
        "data-service-id": "service-2",
        "unique-signers-count": 4,
      })
      .expect(200);

    expect(testResponse2.body[ALL_FEEDS_KEY].length).toBe(4);
    expect(testResponse2.body[ALL_FEEDS_KEY][0].dataPoints.length).toBe(2);
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

    const expectedStreamLengthWithFeedsSpecified = 1662;
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

    const expectedStreamLengthForAllFeeds = 838;
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

    const dataPoints: any[] = signedDataPackage.dataPackage.dataPoints;
    expect(dataPoints.length).toBe(2);
    expect(
      dataPoints.map((dataPoint) => dataPoint.numericDataPointArgs)
    ).toEqual(mockDataPackage.dataPoints);
  }

  it("/data-packages/payload (GET) - should return payload in hex format", async () => {
    await performPayloadTests((response) => {
      return ethers.utils.arrayify(response.text);
    }, "hex");
  });

  it("/data-packages/payload (GET) - should return payload in raw format", async () => {
    await performPayloadTests((response) => {
      return response.body;
    }, "raw");
  });

  it("/data-packages/payload (GET) - should return payload in raw format when no format is specified", async () => {
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
          dataPackagesCount: 12,
          nodeName: "Mock node 1",
          dataServiceId: "mock-data-service-1",
        },
        "0x2": {
          dataPackagesCount: 12,
          nodeName: "unknown",
          dataServiceId: "unknown",
        },
      })
    );
  });

  it("/data-packages/stats (GET) - should fail for an invalid api key", async () => {
    await request(httpServer).get("/data-packages/stats").expect(401);
    await request(httpServer)
      .get("/data-packages/stats")
      .query({
        "api-key": "invalid-api-key",
      })
      .expect(401);
  });
});
