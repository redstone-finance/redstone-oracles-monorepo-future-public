import { consts } from "@redstone-finance/protocol";
import { MongoBroadcaster } from "../../src/broadcasters/mongo-broadcaster";
import { compressMsg } from "../../src/common/streamr";
import {
  DataPackage,
  DataPackageDocument,
} from "../../src/data-packages/data-packages.model";
import { DataPackagesService } from "../../src/data-packages/data-packages.service";
import { StreamrListenerService } from "../../src/streamr-listener/streamr-listener.service";
import {
  MOCK_DATA_SERVICE_ID,
  MOCK_SIGNER_ADDRESS,
  getMockDataPackages,
  mockOracleRegistryState,
} from "../common/mock-values";
import "../common/set-test-envs";
import { createTestDB, dropTestDatabase } from "../common/test-db";
import { sleep } from "../common/test-utils";

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock("@redstone-finance/sdk", () => ({
  __esModule: true,
  ...jest.requireActual("@redstone-finance/sdk"),
  getOracleRegistryState: jest.fn(() => mockOracleRegistryState),
}));

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock("../../src/common/streamr", () => ({
  __esModule: true,
  ...jest.requireActual("../../src/common/streamr"),
  StreamrClient: jest.fn().mockImplementation(() => ({
    subscribe(_streamId: string, callback: (msg: Uint8Array) => void) {
      callback(compressMsg(getMockDataPackages()));
    },
    getStream(_streamId: string) {
      return Promise.resolve({ streamId: _streamId });
    },
  })),
}));

const mongoBroadcaster = new MongoBroadcaster();
const mongoBroadcasterBroadcastSpy = jest.spyOn(mongoBroadcaster, "broadcast");

const dataPackageService = new DataPackagesService(mongoBroadcaster);

const expectedSavedDataPackages = [
  {
    ...getMockDataPackages()[0],
    signerAddress: MOCK_SIGNER_ADDRESS,
    dataServiceId: MOCK_DATA_SERVICE_ID,
    isSignatureValid: true,
    dataFeedId: consts.ALL_FEEDS_KEY,
    dataPackageId: consts.ALL_FEEDS_KEY,
  },
];

describe("Streamr Listener (e2e)", () => {
  let streamrListenerService: StreamrListenerService;

  beforeEach(async () => {
    // Connect to mongoDB in memory
    await createTestDB();

    streamrListenerService = new StreamrListenerService(dataPackageService);
    mongoBroadcasterBroadcastSpy.mockClear();
  });

  afterEach(async () => await dropTestDatabase());

  it("Should listen to streamr streams and save data in DB", async () => {
    await streamrListenerService.syncStreamrListening();
    await sleep(1000);

    const dataPackagesInDB = await DataPackage.find<DataPackageDocument>();
    const dataPackagesInDBCleaned = dataPackagesInDB.map((dp) => {
      const { _id, __v, ...rest } = dp.toJSON();
      // temporary for backward compatibility
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      rest.dataFeedId = rest.dataPackageId;
      return rest;
    });

    expect(dataPackagesInDBCleaned).toEqual(expectedSavedDataPackages);
  });
});
