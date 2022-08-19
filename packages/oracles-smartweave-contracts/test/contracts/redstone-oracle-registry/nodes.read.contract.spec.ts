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
} from "../../../src/contracts/redstone-oracle-registry/types";
import { mockNodes } from "./mocks/nodes.mock";

describe("Redstone oracle registry contract - nodes - read", () => {
  let contractSrc: string;
  let wallet: JWKInterface;
  let walletAddress: string;
  let arweave: Arweave;
  let arlocal: ArLocal;
  let smartweave: SmartWeave;
  let initialState: RedstoneOraclesState;
  let contract: Contract<RedstoneOraclesState>;

  beforeAll(async () => {
    arlocal = new ArLocal(1820, false);
    await arlocal.start();

    arweave = Arweave.init({
      host: "localhost",
      port: 1820,
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

    initialState = {
      canEvolve: true,
      evolve: null,
      contractAdmins: [walletAddress],
      nodes: mockNodes,
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

  describe("listNodes", () => {
    test("list all nodes", async () => {
      const { result } = await contract.dryWrite<RedstoneOraclesInput>({
        function: "listNodes",
        data: {},
      });
      const expectedNodes = [
        "testNodeAddress1",
        "testNodeAddress2",
        "testNodeAddress3",
        "testNodeAddress4",
        "testNodeAddress5",
        "testNodeAddress6",
      ];
      expect(result).toEqual(expectedNodes);
    });

    test("list nodes limited to 2", async () => {
      const { result } = await contract.dryWrite<RedstoneOraclesInput>({
        function: "listNodes",
        data: {
          limit: 2,
        },
      });
      const expectedNodes = ["testNodeAddress1", "testNodeAddress2"];
      expect(result).toEqual(expectedNodes);
    });

    test("list nodes after third", async () => {
      const { result } = await contract.dryWrite<RedstoneOraclesInput>({
        function: "listNodes",
        data: {
          startAfter: 3,
        },
      });
      const expectedNodes = [
        "testNodeAddress4",
        "testNodeAddress5",
        "testNodeAddress6",
      ];
      expect(result).toEqual(expectedNodes);
    });

    test("list nodes limited to 3 after second", async () => {
      const { result } = await contract.dryWrite<RedstoneOraclesInput>({
        function: "listNodes",
        data: {
          limit: 3,
          startAfter: 2,
        },
      });
      const expectedNodes = [
        "testNodeAddress3",
        "testNodeAddress4",
        "testNodeAddress5",
      ];
      expect(result).toEqual(expectedNodes);
    });
  });

  describe("getNodeDetails", () => {
    test("get details of first node", async () => {
      const { result } = await contract.dryWrite<RedstoneOraclesInput>({
        function: "getNodeDetails",
        data: {
          address: "testNodeAddress1",
        },
      });
      const expectedNodeDetails = {
        address: "testNodeAddress1",
        name: "testName1",
        logo: "logo",
        description: "testDescription",
        dataServiceId: "testId",
        evmAddress: "testAddress",
        ipAddress: "testIpAddress",
        ecdsaPublicKey: "testECDSAPublicKey",
        arweavePublicKey: "testArweavePubicKey",
        url: "testUrl",
      };
      expect(result).toEqual(expectedNodeDetails);
    });

    test("get details of middle node", async () => {
      const { result } = await contract.dryWrite<RedstoneOraclesInput>({
        function: "getNodeDetails",
        data: {
          address: "testNodeAddress4",
        },
      });
      const expectedNodeDetails = {
        address: "testNodeAddress4",
        name: "testName4",
        logo: "logo",
        description: "testDescription",
        dataServiceId: "testId",
        evmAddress: "testAddress",
        ipAddress: "testIpAddress",
        ecdsaPublicKey: "testECDSAPublicKey",
        arweavePublicKey: "testArweavePubicKey",
        url: "testUrl",
      };
      expect(result).toEqual(expectedNodeDetails);
    });

    test("throw error if no address in input", async () => {
      const { errorMessage } = await contract.dryWrite<RedstoneOraclesInput>({
        function: "getNodeDetails",
        data: {},
      });
      expect(errorMessage).toBe("Missing oracle identifier");
    });

    test("throw error if invalid address in input", async () => {
      const { errorMessage } = await contract.dryWrite<RedstoneOraclesInput>({
        function: "getNodeDetails",
        data: {
          address: "invalidNodeAddress",
        },
      });

      expect(errorMessage).toBe(
        "Oracle with identifier invalidNodeAddress does not exist"
      );
    });
  });
});
