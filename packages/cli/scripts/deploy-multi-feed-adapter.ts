import {
  createMultiFeedAdapterContractFromTemplate,
  deployMultiFeedAdapter,
} from "@redstone-finance/contract-deployments";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { defaultUpdateTriggers, MANIFEST_PATH } from "../src/constants";

interface TaskParams {
  networkName: string;
  proxyAdminOwner: string;
}

task(
  "deploy-multi-feed-adapter",
  "generate and deploy multi-feed adapter",
  generateAndDeployMultiFeedAdapter
).addParam(
  "proxyAdminOwner",
  "address of proxy admin owner, e.g. safe multisig"
);

async function generateAndDeployMultiFeedAdapter(
  { proxyAdminOwner }: TaskParams,
  hre: HardhatRuntimeEnvironment
) {
  const contractName = await createMultiFeedAdapterContractFromTemplate(
    hre.network.name
  );
  const contractAddress = await deployMultiFeedAdapter(
    {
      contractName,
      proxyAdminOwner,
      manifestPath: MANIFEST_PATH,
      updateTriggers: defaultUpdateTriggers,
    },
    hre
  );
  console.log(
    `Deployed multi-feed adapter contract on ${hre.network.name} with address ${contractAddress}`
  );
}
