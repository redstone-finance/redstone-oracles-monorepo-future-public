import chalk from "chalk";
import { readSsmRpcUrls } from "./read-ssm-rpc-urls";

interface RpcUrlSet {
  [key: string]: {
    chainId: number;
    rpcUrls: string[];
  };
}

const compareRpcUrlSets = (
  set1: RpcUrlSet,
  set2: RpcUrlSet,
  setName1: string,
  setName2: string,
  skipChainIds: number[]
) => {
  for (const chain in set1) {
    const chainId = set1[chain].chainId;

    if (skipChainIds.includes(chainId)) {
      console.log(
        chalk.yellow(`Skipping chain ${chain} with chainId ${chainId}`)
      );
      continue;
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!set2[chain]) {
      console.log(`${setName2} does not contain ${chain}`);
      continue;
    }

    const missingUrls = set1[chain].rpcUrls.filter(
      (url) => !set2[chain].rpcUrls.includes(url)
    );

    if (missingUrls.length > 0) {
      console.log(
        "\n---------------------------------------------------------------------\n"
      );
      console.error(chalk.red(`- Missing configuration for ${chain}`));
      console.log(`${setName1} for ${chain}:`);
      missingUrls.forEach((url) => {
        console.log(`${new URL(url).origin}`);
      });

      console.log(`${setName2} for ${chain}:`);
      set2[chain].rpcUrls.forEach((rpcUrl) => {
        console.log(`${new URL(rpcUrl).origin}`);
      });
    }
  }
};

const compareRpcUrls = async (
  readSsmRpcUrlsFunction: (isFallback: boolean) => Promise<RpcUrlSet>,
  skipChainIds: number[]
) => {
  try {
    const mainRpcUrls = await readSsmRpcUrlsFunction(false);
    const fallbackRpcUrls = await readSsmRpcUrlsFunction(true);

    compareRpcUrlSets(
      mainRpcUrls,
      fallbackRpcUrls,
      "Main RPC URLs",
      "Fallback RPC URLs",
      skipChainIds
    );

    compareRpcUrlSets(
      fallbackRpcUrls,
      mainRpcUrls,
      "Fallback RPC URLs",
      "Main RPC URLs",
      skipChainIds
    );
  } catch (error) {
    console.error("Error fetching RPC URLs:", error);
  }
};

const skipChainIds: number[] = [];
void compareRpcUrls(readSsmRpcUrls, skipChainIds);
