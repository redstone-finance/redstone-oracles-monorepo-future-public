import { Wallet, utils, ContractFactory } from "ethers";
import { WrapperBuilder } from "@redstone-finance/evm-connector";
import { requestDataPackages } from "redstone-sdk";
import PriceFeedsAdapter from "../../artifacts/contracts/price-feeds/PriceFeedsAdapter.sol/PriceFeedsAdapter.json";
import PriceFeed from "../../artifacts/contracts/price-feeds/PriceFeed.sol/PriceFeed.json";
import { getProvider } from "../core/contract-interactions/get-provider";
import { config } from "../config";

(async () => {
  const provider = getProvider();
  const signer = new Wallet(config.privateKey, provider);
  const dataFeeds = config.dataFeeds as string[];

  console.log("Deploying adapter contract...");
  const adapterFactory = new ContractFactory(
    PriceFeedsAdapter.abi,
    PriceFeedsAdapter.bytecode,
    signer
  );
  const dataFeedsAsBytes32 = dataFeeds.map(utils.formatBytes32String);
  const adapterContract = await adapterFactory.deploy(dataFeedsAsBytes32);
  await adapterContract.deployed();
  console.log(`Adapter contract deployed - ${adapterContract.address}`);

  console.log("Deploying price feeds contracts...");
  for (const dataFeed of dataFeeds) {
    const priceFeedFactory = new ContractFactory(
      PriceFeed.abi,
      PriceFeed.bytecode,
      signer
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
