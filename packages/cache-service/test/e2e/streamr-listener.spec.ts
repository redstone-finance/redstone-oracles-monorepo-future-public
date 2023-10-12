import { compressMsg } from "@redstone-finance/streamr-proxy";
import { consts } from "@redstone-finance/protocol";
import "../common/set-test-envs";
import {
  MOCK_DATA_SERVICE_ID,
  MOCK_SIGNER_ADDRESS,
  getMockDataPackages,
  mockOracleRegistryState,
} from "../common/mock-values";
import { createTestDB, dropTestDatabase } from "../common/test-db";
import {
  DataPackage,
  DataPackageDocument,
} from "../../src/data-packages/data-packages.model";
import { sleep } from "../common/test-utils";
import { StreamrListenerService } from "../../src/streamr-listener/streamr-listener.service";
import { DataPackagesService } from "../../src/data-packages/data-packages.service";
import { BundlrBroadcaster } from "../../src/broadcasters/bundlr-broadcaster";
import { MongoBroadcaster } from "../../src/broadcasters/mongo-broadcaster";

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock("@redstone-finance/sdk", () => ({
  __esModule: true,
  ...jest.requireActual("@redstone-finance/sdk"),
  getOracleRegistryState: jest.fn(() => mockOracleRegistryState),
}));

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock("@redstone-finance/streamr-proxy", () => ({
  __esModule: true,
  ...jest.requireActual("@redstone-finance/streamr-proxy"),
  StreamrClient: jest.fn().mockImplementation(() => ({
    subscribe(_streamId: string, callback: (msg: Uint8Array) => void) {
      callback(compressMsg(getMockDataPackages()));
    },
    getStream(_streamId: string) {
      return Promise.resolve({ streamId: _streamId });
    },
  })),
}));

const bundlrBroadcaster = new BundlrBroadcaster();
const bundlrBroadcasterBroadcastSpy = jest.spyOn(
  bundlrBroadcaster,
  "broadcast"
);
const mongoBroadcaster = new MongoBroadcaster();
const mongoBroadcasterBroadcastSpy = jest.spyOn(mongoBroadcaster, "broadcast");

const dataPackageService = new DataPackagesService(
  bundlrBroadcaster,
  mongoBroadcaster
);

const expectedSavedDataPackages = [
  {
    ...getMockDataPackages()[0],
    signerAddress: MOCK_SIGNER_ADDRESS,
    dataServiceId: MOCK_DATA_SERVICE_ID,
    isSignatureValid: true,
    dataFeedId: consts.ALL_FEEDS_KEY,
  },
];

describe("Streamr Listener (e2e)", () => {
  let streamrListenerService: StreamrListenerService;

  beforeEach(async () => {
    // Connect to mongoDB in memory
    await createTestDB();

    streamrListenerService = new StreamrListenerService(dataPackageService);
    bundlrBroadcasterBroadcastSpy.mockClear();
    mongoBroadcasterBroadcastSpy.mockClear();
  });

  afterEach(async () => await dropTestDatabase());

  it("Should listen to streamr streams and save data in DB", async () => {
    await streamrListenerService.syncStreamrListening();
    await sleep(1000);

    const dataPackagesInDB = await DataPackage.find<DataPackageDocument>();
    const dataPackagesInDBCleaned = dataPackagesInDB.map((dp) => {
      const { _id, __v, ...rest } = dp.toJSON();
      return rest;
    });

    expect(dataPackagesInDBCleaned).toEqual(expectedSavedDataPackages);
  });

  it("Should listen to streamr streams and save data on Bundlr", async () => {
    await streamrListenerService.syncStreamrListening();
    bundlrBroadcasterBroadcastSpy.mockImplementationOnce(() =>
      Promise.resolve()
    );

    await sleep(1000);

    expect(bundlrBroadcasterBroadcastSpy).toBeCalledTimes(1);
    expect(bundlrBroadcasterBroadcastSpy).toBeCalledWith(
      expectedSavedDataPackages
    );
  });

  it("Should listen to streamr streams and save data on Bundlr when allowed data service ids are set", async () => {
    const spy = jest
      .spyOn(streamrListenerService, "getAllowedDataServiceIds")
      .mockReturnValue([
        MOCK_DATA_SERVICE_ID.toLowerCase(),
        "other-data-service",
      ]);
    bundlrBroadcasterBroadcastSpy.mockImplementationOnce(() =>
      Promise.resolve()
    );

    await streamrListenerService.syncStreamrListening();
    await sleep(1000);

    expect(bundlrBroadcasterBroadcastSpy).toBeCalledTimes(1);
    expect(bundlrBroadcasterBroadcastSpy).toBeCalledWith(
      expectedSavedDataPackages
    );
    spy.mockRestore();
  });

  it("Should not listen to streamr streams or save data on Bundlr when no matching allowed data service id is set", async () => {
    const spy = jest
      .spyOn(streamrListenerService, "getAllowedDataServiceIds")
      .mockReturnValue(["other-data-service"]);
    bundlrBroadcasterBroadcastSpy.mockImplementationOnce(() =>
      Promise.resolve()
    );

    await streamrListenerService.syncStreamrListening();
    await sleep(1000);

    expect(bundlrBroadcasterBroadcastSpy).toBeCalledTimes(0);
    spy.mockRestore();
  });

  it("Should save dataPackages to DB, even if bundlr fails", async () => {
    await streamrListenerService.syncStreamrListening();
    // mocking race first bundlr fails then DB try to save
    mongoBroadcasterBroadcastSpy.mockImplementationOnce(
      () => sleep(20) as Promise<void>
    );
    bundlrBroadcasterBroadcastSpy.mockImplementationOnce(() =>
      Promise.reject()
    );

    await sleep(1000);

    expect(bundlrBroadcasterBroadcastSpy).toBeCalledTimes(1);
    expect(bundlrBroadcasterBroadcastSpy).toBeCalledWith(
      expectedSavedDataPackages
    );

    expect(mongoBroadcasterBroadcastSpy).toBeCalledTimes(1);
    expect(mongoBroadcasterBroadcastSpy).toReturn();
  });

  it("Should save dataPackages to bundlr, even if DB fails", async () => {
    await streamrListenerService.syncStreamrListening();

    // mocking race first data fails then bundlr try to save
    bundlrBroadcasterBroadcastSpy.mockImplementationOnce(
      () => sleep(20) as Promise<void>
    );
    mongoBroadcasterBroadcastSpy.mockImplementationOnce(() => Promise.reject());

    await sleep(1000);

    expect(mongoBroadcasterBroadcastSpy).toBeCalledTimes(1);
    expect(mongoBroadcasterBroadcastSpy).toBeCalledWith(
      expectedSavedDataPackages
    );

    expect(bundlrBroadcasterBroadcastSpy).toBeCalledTimes(1);
    expect(bundlrBroadcasterBroadcastSpy).toReturn();
  });
});
