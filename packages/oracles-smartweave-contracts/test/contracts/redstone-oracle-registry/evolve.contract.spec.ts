import ArLocal from "arlocal";
import Arweave from "arweave";
import { JWKInterface } from "arweave/node/lib/wallet";
import {
  Contract,
  LoggerFactory,
  SmartWeave,
  SmartWeaveNodeFactory,
  SmartWeaveTags,
} from "redstone-smartweave";
import fs from "fs";
import path from "path";
import { addFunds, mineBlock } from "../utils/smartweave-test-utils";
import {
  RedstoneOraclesInput,
  RedstoneOraclesState,
} from "../../../src/contracts/redstone-oracle-registry/types";

describe("Redstone oracle registry contract - evolve", () => {
  let contractSrc: string;
  let wallet: JWKInterface;
  let walletAddress: string;
  let arweave: Arweave;
  let arlocal: ArLocal;
  let smartweave: SmartWeave;
  let initialState: RedstoneOraclesState;
  let contract: Contract<RedstoneOraclesState>;

  beforeAll(async () => {
    arlocal = new ArLocal(1824, false);
    await arlocal.start();

    arweave = Arweave.init({
      host: "localhost",
      port: 1824,
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

  test("update contract source", async () => {
    const newSource = fs.readFileSync(
      path.join(
        __dirname,
        "helpers/redstone-oracle-registry-evolve.contract.js"
      ),
      "utf8"
    );
    const evolveContractTx = await arweave.createTransaction(
      { data: newSource },
      wallet
    );
    evolveContractTx.addTag(
      SmartWeaveTags.APP_NAME,
      "SmartWeaveContractSource"
    );
    evolveContractTx.addTag(SmartWeaveTags.APP_VERSION, "0.3.0");
    evolveContractTx.addTag("Content-Type", "application/javascript");
    await arweave.transactions.sign(evolveContractTx, wallet);
    await arweave.transactions.post(evolveContractTx);
    await mineBlock(arweave);

    await contract.writeInteraction<RedstoneOraclesInput>({
      function: "evolve",
      data: {
        evolveTransactionId: evolveContractTx.id,
      },
    });
    await mineBlock(arweave);

    const testId = "testId";
    const testDataServiceDetails = {
      id: testId,
      name: "testName",
      logo: "testLogo",
      description: "testDescription",
      manifestTxId: "testManifestId",
    };
    await contract.writeInteraction<RedstoneOraclesInput>({
      function: "createDataService",
      data: testDataServiceDetails,
    });
    await mineBlock(arweave);
    const state = (await contract.readState()).state;
    const dataService = state.dataServices[testId];
    expect(state.evolve).toEqual(evolveContractTx.id);
    expect(dataService).toEqual({
      ...{
        name: "evolveName",
        manifestTxId: "evolveManifestTxId",
        logo: "evolveLogo",
        description: "evolveDescription",
      },
      admin: walletAddress,
    });
  });

  test("throw error if invalid address in input", async () => {
    const { errorMessage } = await contract.dryWrite<RedstoneOraclesInput>(
      {
        function: "evolve",
        data: {
          address: "invalidNodeAddress",
        },
      },
      "0x00"
    );

    expect(errorMessage).toBe("Only the admin can evolve a contract");
  });

  test("throw error if no address in input", async () => {
    initialState = {
      canEvolve: false,
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

    const { errorMessage } = await contract.dryWrite<RedstoneOraclesInput>({
      function: "evolve",
      data: {
        evolveTransactionId: "testTransactionId",
      },
    });
    expect(errorMessage).toBe("Contract cannot evolve");
  });
});
