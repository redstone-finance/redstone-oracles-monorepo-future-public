import "../common/set-test-envs";
import { signByMockSigner } from "../common/test-utils";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../../src/app.module";
import {
  mockDataPackages,
  mockOracleRegistryState,
  mockSigner,
} from "../common/mock-values";
import { connectToTestDB, dropTestDatabase } from "../common/test-db";
import { DataPackage } from "../../src/data-packages/data-packages.model";
import { BundlrService } from "../../src/bundlr/bundlr.service";

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
      const { _id, __v, ...rest } = dp.toJSON() as any;
      return rest;
    });
    expect(dataPackagesInDBCleaned).toEqual(expectedDataPackages);
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

    expect(await DataPackage.find()).toEqual([]);
  });

  it("/data-packages/latest (GET)", async () => {
    const dataPackagesToInsert = [];
    for (const dataServiceId of ["service-1", "service-2", "service-3"]) {
      for (const dataFeedId of [undefined, "ETH", "AAVE", "BTC"]) {
        for (const signerAddress of ["0x1", "0x2", "0x3", "0x4", "0x5"]) {
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
        expect(dataPackage).toHaveProperty("signature", "mock-signature");
        signers.push(dataPackage.signerAddress);
      }
      expect(signers.length).toBe(4);
      expect(new Set(signers).size).toBe(4);
    }
  });
});
