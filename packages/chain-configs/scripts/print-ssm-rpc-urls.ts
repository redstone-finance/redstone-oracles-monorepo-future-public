import chalk from "chalk";
import { readSsmRpcUrls } from "./read-ssm-rpc-urls";

const MIN_RPC_URLS = 3;
const PATH_TRIM_LENGTH = 5;
const MIN_RPC_URLS_FOR_REPEAT_DOMAIN_CHECK = 4;

const getDomain = (hostname: string): string => {
  const match = hostname.match(/([a-zA-Z0-9-]+\.[a-zA-Z]+)$/);
  return match?.[0] ?? hostname;
};

const isTestNetworkOrKnownNetworkWithIssue = (name: string): boolean => {
  const testnetKeywords = ["testnet", "baklava", "sepolia", "ghostnet"];
  return testnetKeywords.some((keyword) =>
    name.toLowerCase().includes(keyword)
  );
};

const addProblematicNetwork = (
  network: string,
  issues: string[],
  isTestNetworkFlag: boolean,
  problematicMainnetNetworks: Array<{ name: string; problems: string[] }>,
  problematicTestnetNetworks: Array<{ name: string; problems: string[] }>
) => {
  if (isTestNetworkFlag) {
    problematicTestnetNetworks.push({ name: network, problems: issues });
  } else {
    problematicMainnetNetworks.push({ name: network, problems: issues });
  }
};

const printRpcUrls = async (): Promise<void> => {
  try {
    const [mainRpcUrlsPerChain, fallbackRpcUrlsPerChain]: [
      Record<string, { chainId: number; rpcUrls: string[] }>,
      Record<string, { chainId: number; rpcUrls: string[] }>,
    ] = await Promise.all([readSsmRpcUrls(false), readSsmRpcUrls(true)]);
    const problematicMainnetNetworks: Array<{
      name: string;
      problems: string[];
    }> = [];
    const problematicTestnetNetworks: Array<{
      name: string;
      problems: string[];
    }> = [];
    const testNetworks: string[] = [];

    for (const [name, { chainId, rpcUrls }] of Object.entries(
      mainRpcUrlsPerChain
    )) {
      console.log(
        "\n---------------------------------------------------------------------\n"
      );
      console.log(`${name} (${chainId}): `);

      const issues: string[] = [];

      if (rpcUrls.length < MIN_RPC_URLS) {
        console.error(chalk.red(`Number of RPC URLs: ${rpcUrls.length}`));
        issues.push(`Number of RPC URLs: ${rpcUrls.length}`);
      } else {
        console.log(`Number of RPC URLs: ${rpcUrls.length}`);
      }

      const domainCounts = new Map<string, number>();
      for (const rpcUrl of rpcUrls) {
        const domain = getDomain(new URL(rpcUrl).hostname);
        domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
      }

      const sortedDomainCounts = Array.from(domainCounts).sort(
        (a, b) => b[1] - a[1]
      );

      for (const [domain, count] of sortedDomainCounts) {
        if (
          count > 1 &&
          rpcUrls.length < MIN_RPC_URLS_FOR_REPEAT_DOMAIN_CHECK
        ) {
          console.error(chalk.red(`Domain ${domain} repeats ${count} times`));
          issues.push(`Domain ${domain} repeats ${count} times`);
        }
      }

      const isTest = isTestNetworkOrKnownNetworkWithIssue(name);
      if (issues.length > 0) {
        addProblematicNetwork(
          name,
          issues,
          isTest,
          problematicMainnetNetworks,
          problematicTestnetNetworks
        );
      }

      if (isTest) {
        testNetworks.push(name);
      }

      for (const rpcUrl of rpcUrls) {
        const url = new URL(rpcUrl);
        const fullPath = url.pathname + url.search + url.hash;
        const path =
          fullPath.length > PATH_TRIM_LENGTH
            ? fullPath.slice(0, PATH_TRIM_LENGTH) + "..."
            : fullPath;
        console.log(`${url.origin} PATH ${path}`);
      }

      console.log(`\nFallback URLs for ${name}:`);

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!fallbackRpcUrlsPerChain[name]) {
        console.error(chalk.red(`No fallback RPC URLs found for ${name}`));
        issues.push(`No fallback RPC URLs found for ${name}`);
        continue;
      }

      const fallbackRpcUrls = fallbackRpcUrlsPerChain[name].rpcUrls;

      if (fallbackRpcUrls.length < MIN_RPC_URLS) {
        console.error(
          chalk.red(`Number of Fallback RPC URLs: ${fallbackRpcUrls.length}`)
        );
        issues.push(`Number of Fallback RPC URLs: ${fallbackRpcUrls.length}`);
      } else {
        console.log(`Number of Fallback RPC URLs: ${fallbackRpcUrls.length}`);
      }

      for (const fallbackRpcUrl of fallbackRpcUrls) {
        const url = new URL(fallbackRpcUrl);
        const fullPath = url.pathname + url.search + url.hash;
        const path =
          fullPath.length > PATH_TRIM_LENGTH
            ? fullPath.slice(0, PATH_TRIM_LENGTH) + "..."
            : fullPath;
        console.log(`${url.origin} PATH ${path}`);
      }
    }

    console.log(
      "\n---------------------------------------------------------------------\n"
    );
    console.log("Problematic mainnet networks:");
    let networkProblemCount = 0;
    for (const { name, problems } of problematicMainnetNetworks) {
      networkProblemCount++;
      console.log(`-`, networkProblemCount, chalk.red(`${name}:`));
      console.log(`RPC count: ${mainRpcUrlsPerChain[name].rpcUrls.length}`);
      for (const problem of problems) {
        console.log(` ${problem}`);
      }
    }

    console.log(
      "\n---------------------------------------------------------------------\n"
    );
    console.log("Problematic testnet networks or networks with known issue:");
    for (const { name, problems } of problematicTestnetNetworks) {
      console.log(`-`, chalk.red(`${name}:`));
      for (const problem of problems) {
        console.log(` ${problem}`);
      }
    }
  } catch (error) {
    console.error("Error fetching RPC URLs:", error);
  }
};

void printRpcUrls();
