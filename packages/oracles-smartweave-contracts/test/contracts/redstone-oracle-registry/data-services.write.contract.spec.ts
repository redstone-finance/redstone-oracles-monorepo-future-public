import ArLocal from "arlocal";
import Arweave from "arweave";
import { JWKInterface } from "arweave/node/lib/wallet";
import {
  Contract,
  LoggerFactory,
  SmartWeave,
  SmartWeaveNodeFactory,
} from "redstone-smartweave";
import fs from "fs";
import path from "path";
import { addFunds, mineBlock } from "../utils/smartweave-test-utils";
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

describe("Redstone oracle registry contract - data feeds - write", () => {
  let contractSrc: string;
  let wallet: JWKInterface;
  let walletAddress: string;
  let arweave: Arweave;
  let arlocal: ArLocal;
  let smartweave: SmartWeave;
  let initialState: RedstoneOraclesState;
  let contract: Contract<RedstoneOraclesState>;

  beforeAll(async () => {
    arlocal = new ArLocal(1823, false);
    await arlocal.start();

    arweave = Arweave.init({
      host: "localhost",
      port: 1823,
      protocol: "http",
      logging: false,
    });

    LoggerFactory.INST.logLevel("error");

    smartweave = SmartWeaveNodeFactory.memCached(arweave);
    wallet = await arweave.wallets.generate();
    await addFunds(arweave, wallet);
    walletAddress = await arweave.wallets.jwkToAddress(wallet);

    contractSrc = fs.readFileSync(
      path.join(
        __dirname,
        "../../../dist/contracts/redstone-oracle-registry.contract.js"
      ),
      "utf8"
    );
  });

  beforeEach(async () => {
    initialState = {
      canEvolve: true,
      evolve: null,
      contractAdmins: [walletAddress],
      nodes: {},
      dataServices: {},
    };

    const contractTxId = await smartweave.createContract.deploy({
      wallet,
      initState: JSON.stringify(initialState),
      src: contractSrc,
    });

    contract = smartweave.contract(contractTxId);
    contract.connect(wallet);
    await mineBlock(arweave);
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
      await mineBlock(arweave);
      const state = (await contract.readState()).state;
      const dataService = state.dataServices[testId];
      const { id, ...restTestDataService } = testDataServiceDetails;
      expect(dataService).toEqual({
        ...restTestDataService,
        admin: walletAddress,
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

      const testSecondDatafeedDetails = {
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
      await mineBlock(arweave);
      await contract.writeInteraction<RedstoneOraclesInput>({
        function: "createDataService",
        data: testSecondDatafeedDetails,
      });
      await mineBlock(arweave);
      const state = (await contract.readState()).state;
      const firstDataService = state.dataServices["firstTestId"];
      const secondDataService = state.dataServices["secondTestId"];
      const { ["id"]: firstId, ...restFirstTestDataService } =
        testFirsDataServiceDetails;
      expect(firstDataService).toEqual({
        ...restFirstTestDataService,
        admin: walletAddress,
      });
      const { ["id"]: secondId, ...restSecondTestDataService } =
        testSecondDatafeedDetails;
      expect(secondDataService).toEqual({
        ...restSecondTestDataService,
        admin: walletAddress,
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
      await mineBlock(arweave);
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
      await mineBlock(arweave);
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
      await mineBlock(arweave);
      const state = (await contract.readState()).state;
      const dataService = state.dataServices[testId];
      expect(dataService).toEqual({
        ...newDataServiceDetails,
        admin: walletAddress,
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
