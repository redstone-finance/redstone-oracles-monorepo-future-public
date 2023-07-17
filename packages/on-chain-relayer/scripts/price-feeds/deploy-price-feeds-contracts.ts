import { utils } from "ethers";
import { ethers } from "hardhat";
import { WrapperBuilder } from "@redstone-finance/evm-connector";
import { requestDataPackages } from "redstone-sdk";
import { getSigner } from "../../src/core/contract-interactions/get-provider-or-signer";
import { config, setConfigProvider } from "../../src/config";
import { fileSystemConfigProvider } from "../../src/FilesystemConfigProvider";
import { getUniqueSignersThresholdFromContract } from "../../src/core/contract-interactions/get-unique-signers-threshold";
import { RedstoneAdapterBase } from "../../typechain-types";

// Usage: yarn run-script scripts/price-feeds/deploy-price-feeds-contracts.ts
// Note! You should configure the .env file properly before running this script

(async () => {
  setConfigProvider(fileSystemConfigProvider);
  const dataFeeds = config().dataFeeds as string[];

  console.log("Deploying adapter contract...");
  const adapterFactory = await ethers.getContractFactory(
    "PriceFeedsAdapter",
    getSigner()
  );
  const dataFeedsAsBytes32 = dataFeeds.map(utils.formatBytes32String);
  const adapterContract = (await adapterFactory.deploy(
    dataFeedsAsBytes32
  )) as RedstoneAdapterBase;
  await adapterContract.deployed();
  console.log(`Adapter contract deployed - ${adapterContract.address}`);

  console.log("Deploying price feeds contracts...");
  for (const dataFeed of dataFeeds) {
    const priceFeedFactory = await ethers.getContractFactory(
      "PriceFeed",
      getSigner()
    );
    const priceFeedContract = await priceFeedFactory.deploy(
      adapterContract.address,
      utils.formatBytes32String(dataFeed),
      `RedStone price feed for ${dataFeed}`
    );
    await priceFeedContract.deployed();
    console.log(
      `Price feed contract for ${dataFeed} deployed - ${priceFeedContract.address}`
    );
  }

  const uniqueSignersCount = await getUniqueSignersThresholdFromContract(
    adapterContract
  );

  console.log("Updating data feeds values...");
  const { dataServiceId, gasLimit } = config();
  const dataPackages = await requestDataPackages({
    dataServiceId,
    uniqueSignersCount,
    dataFeeds,
  });

  if (adapterContract) {
    const wrappedContract =
      WrapperBuilder.wrap(adapterContract).usingDataPackages(dataPackages);

    const dataPackageTimestamp =
      dataPackages[dataFeeds[0]][0].dataPackage.timestampMilliseconds;

    const firstRound = 1;
    const updateTransaction = await wrappedContract.updateDataFeedsValues(
      firstRound,
      dataPackageTimestamp,
      { gasLimit }
    );
    await updateTransaction.wait();
    console.log("Successfully updated prices");
  } else {
    console.error("Price manager contract not deployed");
  }
})();
