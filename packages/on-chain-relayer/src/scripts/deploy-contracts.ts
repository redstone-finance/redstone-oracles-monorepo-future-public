import { ContractFactory, Wallet, utils } from "ethers";
import { getProvider } from "../utils";
import { config } from "../config";
import managerAbi from "../config/price-feeds-manager.abi.json";
import priceFeedAbi from "../config/price-feed.abi.json";
import { bytesCodes } from "../config/bytes-codes";

(async () => {
  const provider = getProvider();
  const signer = new Wallet(config.privateKey, provider);
  const dataFeeds = config.dataFeeds as string[];

  console.log("Deploying manager contract...");
  const managerFactory = new ContractFactory(
    managerAbi,
    bytesCodes.manager,
    signer
  );
  const dataFeedsAsBytes32 = dataFeeds.map(utils.formatBytes32String);
  const managerContract = await managerFactory.deploy(dataFeedsAsBytes32);
  await managerContract.deployed();
  console.log(`Manager contract deployed - ${managerContract.address}`);

  console.log("Deploying price feeds contracts...");
  for (const dataFeed of dataFeeds) {
    const priceFeedFactory = new ContractFactory(
      priceFeedAbi,
      bytesCodes.priceFeed,
      signer
    );
    const priceFeedContract = await priceFeedFactory.deploy(
      managerContract.address,
      dataFeed,
      `RedStone price feed for ${dataFeed}`
    );
    await priceFeedContract.deployed();
    console.log(
      `Price feed contract for ${dataFeed} deployed - ${priceFeedContract.address}`
    );
  }
})();
