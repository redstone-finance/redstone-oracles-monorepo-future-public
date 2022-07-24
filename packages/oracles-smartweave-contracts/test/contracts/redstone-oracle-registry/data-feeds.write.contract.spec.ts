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
  CreateDataFeedInputData,
  RedstoneOraclesInput,
  RedstoneOraclesState,
} from "../../../src/contracts/redstone-oracle-registry/types";

const testId = "testId";
const testDataFeedDetails = {
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
      dataFeeds: {},
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

  describe("createDataFeed", () => {
    test("should add new data feed", async () => {
      await contract.writeInteraction<RedstoneOraclesInput>({
        function: "createDataFeed",
        data: testDataFeedDetails,
      });
      await mineBlock(arweave);
      const state = (await contract.readState()).state;
      const dataFeed = state.dataFeeds[testId];
      const { id, ...restTestDataFeed } = testDataFeedDetails;
      expect(dataFeed).toEqual({
        ...restTestDataFeed,
        admin: walletAddress,
      });
    });

    test("should add two new data feeds", async () => {
      const testFirsDataFeedDetails = {
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
        function: "createDataFeed",
        data: testFirsDataFeedDetails,
      });
      await mineBlock(arweave);
      await contract.writeInteraction<RedstoneOraclesInput>({
        function: "createDataFeed",
        data: testSecondDatafeedDetails,
      });
      await mineBlock(arweave);
      const state = (await contract.readState()).state;
      const firstDataFeed = state.dataFeeds["firstTestId"];
      const secondDataFeed = state.dataFeeds["secondTestId"];
      const { ["id"]: firstId, ...restFirstTestDataFeed } =
        testFirsDataFeedDetails;
      expect(firstDataFeed).toEqual({
        ...restFirstTestDataFeed,
        admin: walletAddress,
      });
      const { ["id"]: secondId, ...restSecondTestDataFeed } =
        testSecondDatafeedDetails;
      expect(secondDataFeed).toEqual({
        ...restSecondTestDataFeed,
        admin: walletAddress,
      });
    });

    test("throw error if missing data feed id in input", async () => {
      const invalidDataFeedDetails = {
        name: "testName",
        logo: "testLogo",
        description: "testDescription",
        manifestTxId: "testManifestId",
      };
      const { errorMessage } = await contract.dryWrite<RedstoneOraclesInput>({
        function: "createDataFeed",
        data: invalidDataFeedDetails as CreateDataFeedInputData,
      });
      expect(errorMessage).toBe("Invalid data feed data");
    });

    test("throw error if missing data feed name in input", async () => {
      const invalidDataFeedDetails = {
        id: testId,
        logo: "testLogo",
        description: "testDescription",
        manifestTxId: "testManifestId",
      };
      const { errorMessage } = await contract.dryWrite<RedstoneOraclesInput>({
        function: "createDataFeed",
        data: invalidDataFeedDetails as CreateDataFeedInputData,
      });
      expect(errorMessage).toBe("Invalid data feed data");
    });

    test("throw error if data feed with the same id already exists", async () => {
      await contract.writeInteraction<RedstoneOraclesInput>({
        function: "createDataFeed",
        data: testDataFeedDetails,
      });
      await mineBlock(arweave);
      const { errorMessage } = await contract.dryWrite<RedstoneOraclesInput>({
        function: "createDataFeed",
        data: testDataFeedDetails,
      });
      expect(errorMessage).toBe(`Data feed with id ${testId} already exists`);
    });
  });

  describe("updateDataFeed", () => {
    beforeEach(async () => {
      await contract.writeInteraction<RedstoneOraclesInput>({
        function: "createDataFeed",
        data: testDataFeedDetails,
      });
      await mineBlock(arweave);
    });

    test("should update data feed details", async () => {
      const newDataFeedDetails = {
        name: "newTestName",
        logo: "newTestLogo",
        description: "newTestDescription",
        manifestTxId: "newTestManifestId",
      };
      await contract.writeInteraction<RedstoneOraclesInput>({
        function: "updateDataFeed",
        data: {
          id: testId,
          update: newDataFeedDetails,
        },
      });
      await mineBlock(arweave);
      const state = (await contract.readState()).state;
      const dataFeed = state.dataFeeds[testId];
      expect(dataFeed).toEqual({
        ...newDataFeedDetails,
        admin: walletAddress,
      });
    });

    test("throw error if invalid data feed id", async () => {
      const newDataFeedDetails = {
        name: "newTestName",
        logo: "newTestLogo",
        description: "newTestDescription",
        manifestTxId: "newTestManifestId",
      };
      const { errorMessage } = await contract.dryWrite<RedstoneOraclesInput>({
        function: "updateDataFeed",
        data: {
          id: "invalidId",
          update: newDataFeedDetails,
        },
      });
      expect(errorMessage).toBe("Data feed with id invalidId not found");
    });

    test("throw error if update by not admin", async () => {
      const newDataFeedDetails = {
        name: "newTestName",
        logo: "newTestLogo",
        description: "newTestDescription",
        manifestTxId: "newTestManifestId",
      };
      const { errorMessage } = await contract.dryWrite<RedstoneOraclesInput>(
        {
          function: "updateDataFeed",
          data: {
            id: testId,
            update: newDataFeedDetails,
          },
        },
        "0x00"
      );
      expect(errorMessage).toBe("Only admin can update data feed");
    });
  });
});
