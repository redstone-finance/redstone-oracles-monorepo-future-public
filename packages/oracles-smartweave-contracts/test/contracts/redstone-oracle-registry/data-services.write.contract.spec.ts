import ArLocal from "arlocal";
import fs from "fs";
import path from "path";
import { Contract, Warp, WarpFactory } from "warp-contracts";
import { Wallet } from "warp-contracts/lib/types/contract/testing/Testing";
import {
  CreateDataServiceInputData,
  RedstoneOraclesInput,
  RedstoneOraclesState,
} from "../../../src/contracts/redstone-oracle-registry/types";

const testId = "testId";
const testDataServiceDetails = {
  id: testId,
  name: "testName",
  logo: "testLogo",
  description: "testDescription",
  manifestTxId: "testManifestId",
};

describe("RedStone oracle registry contract - data feeds - write", () => {
  let contractSrc: string;
  let arlocal: ArLocal;
  let warp: Warp;
  let wallet: Wallet;
  let initialState: RedstoneOraclesState;
  let contract: Contract<RedstoneOraclesState>;

  beforeAll(async () => {
    arlocal = new ArLocal(1823, false);
    await arlocal.start();

    warp = WarpFactory.forLocal(1823);
    wallet = await warp.generateWallet();
    await warp.testing.addFunds(wallet.jwk);

    contractSrc = fs.readFileSync(
      path.join(
        __dirname,
        "../../../dist/contracts/redstone-oracle-registry.contract.js"
      ),
      "utf8"
    );

    initialState = {
      canEvolve: true,
      evolve: null,
      contractAdmins: [wallet.address],
      nodes: {},
      dataServices: {},
    };

    const contractTx = await warp.deploy({
      wallet: wallet.jwk,
      initState: JSON.stringify(initialState),
      src: contractSrc,
    });

    contract = warp.contract(contractTx.contractTxId);
    contract.connect(wallet.jwk);
  });

  afterAll(async () => {
    await arlocal.stop();
  });

  describe("createDataService", () => {
    test("should add new data feed", async () => {
      await contract.writeInteraction<RedstoneOraclesInput>({
        function: "createDataService",
        data: testDataServiceDetails,
      });
      const state = (await contract.readState()).cachedValue.state;
      const dataService = state.dataServices[testId];
      const { id: _id, ...restTestDataService } = testDataServiceDetails;
      expect(dataService).toEqual({
        ...restTestDataService,
        admin: wallet.address,
      });
    });

    test("should add two new data feeds", async () => {
      const testFirsDataServiceDetails = {
        id: "firstTestId",
        name: "firstTestName",
        logo: "firstTestLogo",
        description: "firstTestDescription",
        manifestTxId: "firstTestManifestId",
      };

      const testSecondDataServiceDetails = {
        id: "secondTestId",
        name: "secondTestName",
        logo: "secondTestLogo",
        description: "secondTestDescription",
        manifestTxId: "secondTestManifestId",
      };
      await contract.writeInteraction<RedstoneOraclesInput>({
        function: "createDataService",
        data: testFirsDataServiceDetails,
      });
      await contract.writeInteraction<RedstoneOraclesInput>({
        function: "createDataService",
        data: testSecondDataServiceDetails,
      });
      const state = (await contract.readState()).cachedValue.state;
      const firstDataService = state.dataServices["firstTestId"];
      const secondDataService = state.dataServices["secondTestId"];
      const { ["id"]: _firstId, ...restFirstTestDataService } =
        testFirsDataServiceDetails;
      expect(firstDataService).toEqual({
        ...restFirstTestDataService,
        admin: wallet.address,
      });
      const { ["id"]: _secondId, ...restSecondTestDataService } =
        testSecondDataServiceDetails;
      expect(secondDataService).toEqual({
        ...restSecondTestDataService,
        admin: wallet.address,
      });
    });

    test("throw error if missing data feed id in input", async () => {
      const invalidDataServiceDetails = {
        name: "testName",
        logo: "testLogo",
        description: "testDescription",
        manifestTxId: "testManifestId",
      };
      const { errorMessage } = await contract.dryWrite<RedstoneOraclesInput>({
        function: "createDataService",
        data: invalidDataServiceDetails as CreateDataServiceInputData,
      });
      expect(errorMessage).toBe("Invalid data feed data");
    });

    test("throw error if missing data feed name in input", async () => {
      const invalidDataServiceDetails = {
        id: testId,
        logo: "testLogo",
        description: "testDescription",
        manifestTxId: "testManifestId",
      };
      const { errorMessage } = await contract.dryWrite<RedstoneOraclesInput>({
        function: "createDataService",
        data: invalidDataServiceDetails as CreateDataServiceInputData,
      });
      expect(errorMessage).toBe("Invalid data feed data");
    });

    test("throw error if data feed with the same id already exists", async () => {
      await contract.writeInteraction<RedstoneOraclesInput>({
        function: "createDataService",
        data: testDataServiceDetails,
      });
      const { errorMessage } = await contract.dryWrite<RedstoneOraclesInput>({
        function: "createDataService",
        data: testDataServiceDetails,
      });
      expect(errorMessage).toBe(`Data feed with id ${testId} already exists`);
    });
  });

  describe("updateDataService", () => {
    beforeEach(async () => {
      await contract.writeInteraction<RedstoneOraclesInput>({
        function: "createDataService",
        data: testDataServiceDetails,
      });
    });

    test("should update data feed details", async () => {
      const newDataServiceDetails = {
        name: "newTestName",
        logo: "newTestLogo",
        description: "newTestDescription",
        manifestTxId: "newTestManifestId",
      };
      await contract.writeInteraction<RedstoneOraclesInput>({
        function: "updateDataService",
        data: {
          id: testId,
          update: newDataServiceDetails,
        },
      });
      const state = (await contract.readState()).cachedValue.state;
      const dataService = state.dataServices[testId];
      expect(dataService).toEqual({
        ...newDataServiceDetails,
        admin: wallet.address,
      });
    });

    test("throw error if invalid data feed id", async () => {
      const newDataServiceDetails = {
        name: "newTestName",
        logo: "newTestLogo",
        description: "newTestDescription",
        manifestTxId: "newTestManifestId",
      };
      const { errorMessage } = await contract.dryWrite<RedstoneOraclesInput>({
        function: "updateDataService",
        data: {
          id: "invalidId",
          update: newDataServiceDetails,
        },
      });
      expect(errorMessage).toBe("Data feed with id invalidId not found");
    });

    test("throw error if update by not admin", async () => {
      const newDataServiceDetails = {
        name: "newTestName",
        logo: "newTestLogo",
        description: "newTestDescription",
        manifestTxId: "newTestManifestId",
      };
      const { errorMessage } = await contract.dryWrite<RedstoneOraclesInput>(
        {
          function: "updateDataService",
          data: {
            id: testId,
            update: newDataServiceDetails,
          },
        },
        "0x00"
      );
      expect(errorMessage).toBe("Only admin can update data feed");
    });
  });
});
