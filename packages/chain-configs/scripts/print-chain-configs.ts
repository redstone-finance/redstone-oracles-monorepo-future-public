import { fetchChainConfigs } from "../src";

const main = async () => {
  const chainConfigs = await fetchChainConfigs();
  console.log(chainConfigs);
};

void main();
