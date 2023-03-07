import { ContractFactory, Wallet, utils } from "ethers";
import { getProvider } from "../utils";
import { config } from "../config";
import managerAbi from "../config/price-feeds-manager.abi.json";
import registryAbi from "../config/price-feeds-registry.abi.json";
import { bytesCodes } from "../config/bytes-codes";

const dataFeed = "";

(async () => {
  const provider = getProvider();
  const signer = new Wallet(config.privateKey, provider);

  console.log("Deploying manager contract...");
  const managerFactory = new ContractFactory(
    managerAbi,
    bytesCodes.manager,
    signer
  );
  const managerContract = await managerFactory.deploy();
  await managerContract.deployed();
  console.log(`Manager contract deployed: ${managerContract.address}`);

  console.log("Deploying registry contract...");
  const registryFactory = new ContractFactory(
    registryAbi,
    bytesCodes.registry,
    signer
  );
  const registryContract = await registryFactory.deploy(
    managerContract.address
  );
  await registryContract.deployed();
  console.log(`Registry contract deployed: ${registryContract.address}`);

  console.log(
    "Initializing manager contract with registry contract address..."
  );
  const initializeTransaction = await managerContract.initialize(
    registryContract.address
  );
  await initializeTransaction.wait();
  console.log("Manager contract initialized");

  console.log(`Adding ${dataFeed} data feed to registry...`);
  const ohmDataFeedId = utils.formatBytes32String(dataFeed);
  const addDataFeedTransaction = await registryContract.addDataFeed(
    ohmDataFeedId
  );
  await addDataFeedTransaction.wait();
  console.log(`${dataFeed} data feed to registry added`);
})();
