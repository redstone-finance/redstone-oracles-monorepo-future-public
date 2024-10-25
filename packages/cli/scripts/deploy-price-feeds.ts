import { generateAndDeployPriceFeedsContracts } from "@redstone-finance/contract-deployments";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { MANIFEST_PATH } from "../src/constants";

interface TaskParams {
  feeds: string;
}

task(
  "deploy-price-feeds",
  "generate and deploy price feeds for multi-feed adapter",
  generateAndDeployPriceFeeds
).addParam(
  "feeds",
  "feeds to deploy price feeds for multi feed adapter passed as e.g. ETH,BTC"
);

async function generateAndDeployPriceFeeds(
  { feeds }: TaskParams,
  hre: HardhatRuntimeEnvironment
) {
  const newPriceFeeds = await generateAndDeployPriceFeedsContracts(
    {
      networkName: hre.network.name,
      dataFeedsIds: feeds,
      manifestPath: MANIFEST_PATH,
    },
    hre
  );
  console.log(
    `Deployed price feeds contract on ${hre.network.name} with addresses ${JSON.stringify(newPriceFeeds, null, 4)}`
  );
}
