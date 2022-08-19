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
  RedstoneOraclesInput,
  RedstoneOraclesState,
  RegisterNodeInputData,
} from "../../../src/contracts/redstone-oracle-registry/types";

const testNodeDetails = {
  name: "testName",
  logo: "testLogo",
  description: "testDescription",
  dataServiceId: "testId",
  evmAddress: "testAddress",
  ipAddress: "testIP",
  ecdsaPublicKey: "testECDSAPublicKey",
  arweavePublicKey: "testArweavePubicKey",
  url: "testUrl",
};

describe("Redstone oracle registry contract - nodes - write", () => {
  let contractSrc: string;
  let wallet: JWKInterface;
  let walletAddress: string;
  let arweave: Arweave;
  let arlocal: ArLocal;
  let smartweave: SmartWeave;
  let initialState: RedstoneOraclesState;
  let contract: Contract<RedstoneOraclesState>;

  beforeAll(async () => {
    arlocal = new ArLocal(1821, false);
    await arlocal.start();

    arweave = Arweave.init({
      host: "localhost",
      port: 1821,
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
      dataServices: {
        testId: {
          name: "testName",
          logo: "testLogo",
          description: "testDescription",
          manifestTxId: "testManifestId",
          admin: walletAddress,
        },
      },
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

  describe("registerNode", () => {
    test("should add new node when register", async () => {
      await contract.writeInteraction<RedstoneOraclesInput>({
        function: "registerNode",
        data: testNodeDetails,
      });
      await mineBlock(arweave);
      const state = (await contract.readState()).state;
      const node = state.nodes[walletAddress];
      expect(node).toEqual(testNodeDetails);
    });

    test("should add two new nodes when register", async () => {
      const newWallet = await arweave.wallets.generate();
      await addFunds(arweave, newWallet);
      const overwrittenCaller = await arweave.wallets.jwkToAddress(newWallet);
      await mineBlock(arweave);

      const testFirstNodeDetails = {
        name: "testName1",
        logo: "testLogo",
        description: "testDescription",
        dataServiceId: "testId",
        evmAddress: "testAddress1",
        ipAddress: "testIP",
        ecdsaPublicKey: "testECDSAPublicKey",
        arweavePublicKey: "testArweavePubicKey",
        url: "testUrl",
      };

      const testSecondNodeDetails = {
        name: "testName2",
        logo: "testLogo",
        description: "testDescription",
        dataServiceId: "testId",
        evmAddress: "testAddress2",
        ipAddress: "testIP",
        ecdsaPublicKey: "testECDSAPublicKey",
        arweavePublicKey: "testArweavePubicKey",
        url: "testUrl",
      };
      await contract.writeInteraction<RedstoneOraclesInput>({
        function: "registerNode",
        data: testFirstNodeDetails,
      });
      await mineBlock(arweave);
      const result = await contract.dryWrite<RedstoneOraclesInput>(
        {
          function: "registerNode",
          data: testSecondNodeDetails,
        },
        overwrittenCaller
      );
      const firstNode = result.state.nodes[walletAddress];
      const secondNode = result.state.nodes[overwrittenCaller];
      expect(firstNode).toEqual(testFirstNodeDetails);
      expect(secondNode).toEqual(testSecondNodeDetails);
    });

    test("throw error if missing node name in input", async () => {
      const invalidNodeDetails = {
        logo: "testLogo",
        description: "testDescription",
        dataServiceId: "testId",
        ipAddress: "testIP",
        evmAddress: "testAddress",
        url: "testUrl",
      };
      const { errorMessage } = await contract.dryWrite<RedstoneOraclesInput>({
        function: "registerNode",
        data: invalidNodeDetails as RegisterNodeInputData,
      });
      expect(errorMessage).toBe("Invalid node data");
    });

    test("throw error if caller already has node", async () => {
      await contract.writeInteraction<RedstoneOraclesInput>({
        function: "registerNode",
        data: testNodeDetails,
      });
      await mineBlock(arweave);
      const { errorMessage } = await contract.dryWrite<RedstoneOraclesInput>({
        function: "registerNode",
        data: testNodeDetails,
      });
      expect(errorMessage).toBe(
        `Node with owner ${walletAddress} already exists`
      );
    });

    test("throw error if invalid data feed id", async () => {
      const { errorMessage } = await contract.dryWrite<RedstoneOraclesInput>({
        function: "registerNode",
        data: { ...testNodeDetails, dataServiceId: "invaliddataServiceId" },
      });
      expect(errorMessage).toBe(
        "Data feed with id invaliddataServiceId does not exist"
      );
    });
  });

  describe("updateNodeDetails", () => {
    beforeEach(async () => {
      await contract.writeInteraction<RedstoneOraclesInput>({
        function: "registerNode",
        data: testNodeDetails,
      });
      await mineBlock(arweave);
    });

    test("should update node details", async () => {
      const newNodeDetails = {
        name: "newTestName",
        logo: "newTestLogo",
        description: "newTestDescription",
        dataServiceId: "newTestId",
        evmAddress: "testAddress",
        ipAddress: "newTestIP",
        ecdsaPublicKey: "newTestECDSAPublicKey",
        arweavePublicKey: "newTestArweavePubicKey",
        url: "newTestUrl",
      };
      await contract.writeInteraction<RedstoneOraclesInput>({
        function: "updateNodeDetails",
        data: newNodeDetails,
      });
      await mineBlock(arweave);
      const state = (await contract.readState()).state;
      const node = state.nodes[walletAddress];
      expect(node).toEqual(newNodeDetails);
    });

    test("throw error if invalid owner address", async () => {
      const newNodeDetails = {
        name: "newTestName",
        logo: "newTestLogo",
        description: "newTestDescription",
        dataServiceId: "newTestId",
        evmAddress: "testAddress",
        ipAddress: "newTestIP",
        url: "newTestUrl",
      };
      const { errorMessage } = await contract.dryWrite<RedstoneOraclesInput>(
        {
          function: "updateNodeDetails",
          data: newNodeDetails,
        },
        "0x00"
      );
      expect(errorMessage).toBe("Node with owner 0x00 not found");
    });
  });

  describe("removeNode", () => {
    beforeEach(async () => {
      await contract.writeInteraction<RedstoneOraclesInput>({
        function: "registerNode",
        data: testNodeDetails,
      });
      await mineBlock(arweave);
    });

    test("should remove node", async () => {
      await contract.writeInteraction<RedstoneOraclesInput>({
        function: "removeNode",
        data: {},
      });
      await mineBlock(arweave);
      const state = (await contract.readState()).state;
      const node = state.nodes[walletAddress];
      expect(node).toBeUndefined();
    });

    test("throw error if invalid owner address", async () => {
      const { errorMessage } = await contract.dryWrite<RedstoneOraclesInput>(
        {
          function: "removeNode",
          data: {},
        },
        "0x00"
      );
      expect(errorMessage).toBe("Node with owner 0x00 not found");
    });
  });
});
