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
import { mockDataServices } from "./mocks/dataServices.mock";

describe("Redstone oracle registry contract - data feeds - read", () => {
  let contractSrc: string;
  let wallet: JWKInterface;
  let walletAddress: string;
  let arweave: Arweave;
  let arlocal: ArLocal;
  let smartweave: SmartWeave;
  let initialState: RedstoneOraclesState;
  let contract: Contract<RedstoneOraclesState>;

  beforeAll(async () => {
    arlocal = new ArLocal(1822, false);
    await arlocal.start();

    arweave = Arweave.init({
      host: "localhost",
      port: 1822,
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
      nodes: {},
      dataServices: mockDataServices,
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

  describe("listDataServices", () => {
    test("list all data feeds", async () => {
      const { result } = await contract.dryWrite<RedstoneOraclesInput>({
        function: "listDataServices",
        data: {},
      });
      const expectedDataServices = [
        "testId1",
        "testId2",
        "testId3",
        "testId4",
        "testId5",
        "testId6",
      ];
      expect(result).toEqual(expectedDataServices);
    });

    test("list data feeds limited to 2", async () => {
      const { result } = await contract.dryWrite<RedstoneOraclesInput>({
        function: "listDataServices",
        data: {
          limit: 2,
        },
      });
      const expectedDataServices = ["testId1", "testId2"];
      expect(result).toEqual(expectedDataServices);
    });

    test("list data feeds after third", async () => {
      const { result } = await contract.dryWrite<RedstoneOraclesInput>({
        function: "listDataServices",
        data: {
          startAfter: 3,
        },
      });
      const expectedDataServices = ["testId4", "testId5", "testId6"];
      expect(result).toEqual(expectedDataServices);
    });

    test("list data feeds limited to 3 after second", async () => {
      const { result } = await contract.dryWrite<RedstoneOraclesInput>({
        function: "listDataServices",
        data: {
          limit: 3,
          startAfter: 2,
        },
      });
      const expectedDataServices = ["testId3", "testId4", "testId5"];
      expect(result).toEqual(expectedDataServices);
    });
  });

  describe("getDataServiceDetailsById", () => {
    test("get details of first data feed", async () => {
      const { result } = await contract.dryWrite<RedstoneOraclesInput>({
        function: "getDataServiceDetailsById",
        data: {
          id: "testId1",
        },
      });
      const expectedDataServiceDetails = {
        id: "testId1",
        name: "testName1",
        logo: "logo",
        description: "testDescription",
        manifestTxId: "testManifestId",
        admin: "testAddress",
      };
      expect(result).toEqual(expectedDataServiceDetails);
    });

    test("get details of middle data feed", async () => {
      const { result } = await contract.dryWrite<RedstoneOraclesInput>({
        function: "getDataServiceDetailsById",
        data: {
          id: "testId4",
        },
      });
      const expectedDataServiceDetails = {
        id: "testId4",
        name: "testName4",
        logo: "logo",
        description: "testDescription",
        manifestTxId: "testManifestId",
        admin: "testAddress",
      };
      expect(result).toEqual(expectedDataServiceDetails);
    });

    test("throw error if no id in input", async () => {
      const { errorMessage } = await contract.dryWrite<RedstoneOraclesInput>({
        function: "getDataServiceDetailsById",
        data: {},
      });
      expect(errorMessage).toBe("Missing oracle identifier");
    });

    test("throw error if invalid id in input", async () => {
      const { errorMessage } = await contract.dryWrite<RedstoneOraclesInput>({
        function: "getDataServiceDetailsById",
        data: {
          id: "invalidId",
        },
      });

      expect(errorMessage).toBe(
        "Oracle with identifier invalidId does not exist"
      );
    });
  });
});
