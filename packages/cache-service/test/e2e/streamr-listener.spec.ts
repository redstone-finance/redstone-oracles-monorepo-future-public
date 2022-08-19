import "../common/set-test-envs";
import {
  mockDataPackages,
  mockOracleRegistryState,
} from "../common/mock-values";
import { connectToTestDB, dropTestDatabase } from "../common/test-db";
import { DataPackage } from "../../src/data-packages/data-packages.model";
import { sleep } from "../common/test-utils";
import { StreamrListenerService } from "../../src/streamr-listener/streamr-listener.service";
import { DataPackagesService } from "../../src/data-packages/data-packages.service";

jest.mock("redstone-sdk", () => ({
  __esModule: true,
  ...jest.requireActual("redstone-sdk"),
  getOracleRegistryState: jest.fn(() => mockOracleRegistryState),
}));

jest.mock("streamr-client", () => ({
  __esModule: true,
  ...jest.requireActual("streamr-client"),
  StreamrClient: jest.fn().mockImplementation(() => ({
    subscribe(_streamId: string, callback: (msg: string) => void) {
      callback(JSON.stringify(mockDataPackages));
    },
  })),
}));

describe("Streamr Listener (e2e)", () => {
  let streamrListenerService: StreamrListenerService;

  beforeEach(async () => {
    // Connect to mongoDB in memory
    await connectToTestDB();

    streamrListenerService = new StreamrListenerService(
      new DataPackagesService()
    );
  });

  afterEach(async () => await dropTestDatabase());

  it("Should correctly listen to streamr streams", async () => {
    await streamrListenerService.syncStreamrListening();
    await sleep(1000);
    const dataPackagesInDB = await DataPackage.find();
    const dataPackagesInDBCleaned = dataPackagesInDB.map((dp) => {
      const { _id, __v, ...rest } = dp.toJSON() as any;
      return rest;
    });
    expect(dataPackagesInDBCleaned).toEqual([
      {
        ...mockDataPackages[0],
        signerAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        dataServiceId: "mock-data-service-1",
      },
    ]);
  });
});
