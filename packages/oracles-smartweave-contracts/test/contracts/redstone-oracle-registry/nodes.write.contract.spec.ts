import ArLocal from "arlocal";
import fs from "fs";
import path from "path";
import { Contract, Warp, WarpFactory } from "warp-contracts";
import { Wallet } from "warp-contracts/lib/types/contract/testing/Testing";
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
  url: "testUrl",
};

describe("RedStone oracle registry contract - nodes - write", () => {
  let contractSrc: string;
  let arlocal: ArLocal;
  let warp: Warp;
  let wallet: Wallet;
  let initialState: RedstoneOraclesState;
  let contract: Contract<RedstoneOraclesState>;

  beforeAll(async () => {
    arlocal = new ArLocal(1826, false);
    await arlocal.start();

    warp = WarpFactory.forLocal(1826);
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
      dataServices: {
        testId: {
          name: "testName",
          logo: "testLogo",
          description: "testDescription",
          manifestTxId: "testManifestId",
          admin: wallet.address,
        },
      },
    };

    const contractTx = await warp.deploy({
      wallet: wallet.jwk,
      initState: JSON.stringify(initialState),
      src: contractSrc,
    });

    contract = warp.contract(contractTx.contractTxId);
    contract.connect(wallet.jwk);
    await warp.testing.mineBlock();
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
      const state = (await contract.readState()).cachedValue.state;
      const node = state.nodes[wallet.address];
      expect(node).toEqual(testNodeDetails);
    });

    test("should add two new nodes when register", async () => {
      const newFirstWallet = await warp.generateWallet();
      const newSecondWallet = await warp.generateWallet();
      await warp.testing.addFunds(newFirstWallet.jwk);
      await warp.testing.addFunds(newSecondWallet.jwk);

      const testFirstNodeDetails = {
        name: "testName1",
        logo: "testLogo",
        description: "testDescription",
        dataServiceId: "testId",
        evmAddress: "testAddress1",
        ipAddress: "testIP",
        ecdsaPublicKey: "testECDSAPublicKey",
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
        url: "testUrl",
      };

      await contract
        .connect(newFirstWallet.jwk)
        .writeInteraction<RedstoneOraclesInput>({
          function: "registerNode",
          data: testFirstNodeDetails,
        });
      const result = await contract.dryWrite<RedstoneOraclesInput>(
        {
          function: "registerNode",
          data: testSecondNodeDetails,
        },
        newSecondWallet.address
      );

      const firstNode = result.state.nodes[newFirstWallet.address];
      const secondNode = result.state.nodes[newSecondWallet.address];
      expect(firstNode).toEqual(testFirstNodeDetails);
      expect(secondNode).toEqual(testSecondNodeDetails);
      contract.connect(wallet.jwk);
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
      const { errorMessage } = await contract.dryWrite<RedstoneOraclesInput>({
        function: "registerNode",
        data: testNodeDetails,
      });
      expect(errorMessage).toBe(
        `Node with owner ${wallet.address} already exists`
      );
    });

    test("throw error if invalid data feed id", async () => {
      const newWallet = await warp.generateWallet();
      await warp.testing.addFunds(newWallet.jwk);
      const { errorMessage } = await contract.dryWrite<RedstoneOraclesInput>(
        {
          function: "registerNode",
          data: { ...testNodeDetails, dataServiceId: "invalidDataServiceId" },
        },
        newWallet.address
      );
      expect(errorMessage).toBe(
        "Data feed with id invalidDataServiceId does not exist"
      );
    });
  });

  describe("updateNodeDetails", () => {
    beforeEach(async () => {
      await contract.writeInteraction<RedstoneOraclesInput>({
        function: "registerNode",
        data: testNodeDetails,
      });
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
        url: "newTestUrl",
      };
      await contract.writeInteraction<RedstoneOraclesInput>({
        function: "updateNodeDetails",
        data: newNodeDetails,
      });
      const state = (await contract.readState()).cachedValue.state;
      const node = state.nodes[wallet.address];
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
    });

    test("should remove node", async () => {
      await contract.writeInteraction<RedstoneOraclesInput>({
        function: "removeNode",
        data: {},
      });
      const state = (await contract.readState()).cachedValue.state;
      const node = state.nodes[wallet.address];
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
