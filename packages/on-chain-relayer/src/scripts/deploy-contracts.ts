import { Wallet, utils } from "ethers";
import { ethers } from "hardhat";
import { WrapperBuilder } from "@redstone-finance/evm-connector";
import { requestDataPackages } from "redstone-sdk";
import { getProvider } from "../core/contract-interactions/get-provider";
import { config } from "../config";

(async () => {
  const provider = getProvider();
  const signer = new Wallet(config.privateKey, provider);
  const dataFeeds = config.dataFeeds as string[];

  console.log("Deploying manager contract...");
  const managerFactory = await ethers.getContractFactory(
    "PriceFeedsAdapter",
    signer
  );
  const dataFeedsAsBytes32 = dataFeeds.map(utils.formatBytes32String);
  const managerContract = await managerFactory.deploy(dataFeedsAsBytes32);
  await managerContract.deployed();
  console.log(`Manager contract deployed - ${managerContract.address}`);

  let priceFeedContract;
  console.log("Deploying price feeds contracts...");
  for (const dataFeed of dataFeeds) {
    const priceFeedFactory = await ethers.getContractFactory(
      "PriceFeed",
      signer
    );
    priceFeedContract = await priceFeedFactory.deploy(
      managerContract.address,
      utils.formatBytes32String(dataFeed),
      `RedStone price feed for ${dataFeed}`
    );
    await priceFeedContract.deployed();
    console.log(
      `Price feed contract for ${dataFeed} deployed - ${priceFeedContract.address}`
    );
  }

  console.log("Updating data feeds values...");
  const { dataServiceId, uniqueSignersCount, cacheServiceUrls, gasLimit } =
    config;
  const dataPackages = await requestDataPackages(
    {
      dataServiceId,
      uniqueSignersCount,
      dataFeeds,
    },
    cacheServiceUrls
  );

  if (priceFeedContract) {
    const wrappedContract =
      WrapperBuilder.wrap(priceFeedContract).usingDataPackages(dataPackages);

    const dataPackageTimestamp =
      dataPackages[dataFeeds[0]][0].dataPackage.timestampMilliseconds;

    const firstRound = 1;
    const updateTransaction = await wrappedContract.updateDataFeedValues(
      firstRound,
      dataPackageTimestamp,
      {
        gasLimit,
      }
    );
    await updateTransaction.wait();
    console.log("Successfully updated prices");
  } else {
    console.error("Price manager contract not deployed");
  }
})();
