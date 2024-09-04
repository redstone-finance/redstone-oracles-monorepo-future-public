import { getChainConfigs } from "../src";

const main = async () => {
  const chainConfigs = await getChainConfigs();
  console.log(chainConfigs);
};

void main();
