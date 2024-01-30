import ArLocal from "arlocal";
import fs from "fs";
import path from "path";
import { Contract, Warp, WarpFactory } from "warp-contracts";
import { Wallet } from "warp-contracts/lib/types/contract/testing/Testing";
import {
  RedstoneOraclesInput,
  RedstoneOraclesState,
} from "../../../src/contracts/redstone-oracle-registry/types";

describe("RedStone oracle registry contract - evolve", () => {
  let contractSrc: string;
  let arlocal: ArLocal;
  let warp: Warp;
  let wallet: Wallet;
  let initialState: RedstoneOraclesState;
  let contract: Contract<RedstoneOraclesState>;

  beforeAll(async () => {
    arlocal = new ArLocal(1824, false);
    await arlocal.start();

    warp = WarpFactory.forLocal(1824);
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

  test("update contract source", async () => {
    const newSource = fs.readFileSync(
      path.join(
        __dirname,
        "helpers/redstone-oracle-registry-evolve.contract.js"
      ),
      "utf8"
    );
    const evolveContractTx = await warp.arweave.createTransaction(
      { data: newSource },
      wallet.jwk
    );
    evolveContractTx.addTag("App-Name", "SmartWeaveContractSource");
    evolveContractTx.addTag("App-Version", "0.3.0");
    evolveContractTx.addTag("Content-Type", "application/javascript");
    await warp.arweave.transactions.sign(evolveContractTx, wallet.jwk);
    await warp.arweave.transactions.post(evolveContractTx);

    await contract.writeInteraction<RedstoneOraclesInput>({
      function: "evolve",
      data: {
        evolveTransactionId: evolveContractTx.id,
      },
    });

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
    const state = (await contract.readState()).cachedValue.state;
    const dataService = state.dataServices[testId];
    expect(state.evolve).toEqual(evolveContractTx.id);
    expect(dataService).toEqual({
      ...{
        name: "evolveName",
        manifestTxId: "evolveManifestTxId",
        logo: "evolveLogo",
        description: "evolveDescription",
      },
      admin: wallet.address,
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

    const { errorMessage } = await contract.dryWrite<RedstoneOraclesInput>({
      function: "evolve",
      data: {
        evolveTransactionId: "testTransactionId",
      },
    });
    expect(errorMessage).toBe("Contract cannot evolve");
  });
});
