import {
  getChainConfigByChainId,
  getLocalChainConfigs,
} from "@redstone-finance/chain-configs";
import { providers } from "ethers";
import _ from "lodash";
import { ProviderWithAgreement } from "../src";

const RPC_URLS = [
  "https://mantle-mainnet.blastapi.io/6ebaff4b-205e-4027-8cdc-10c3bacc8abb",
  "https://rpc.mantle.xyz/",
  "https://mantle-rpc.publicnode.com/",
  "https://mantle.drpc.org/",
];
const CHAIN_ID = 5000;
const ACCEPTABLE_BLOCK_DIFF_IN_MS = 10_000;
const TRANSACTION = {
  data: "0xb0f106b0",
  to: "0x43D11B34ceDe79fEa2294f09532C435fa6dd3F72",
  from: "0xB7A97043983f24991398E5a82f63F4C58a417185",
};

const electBlock = (
  blockNumbers: number[],
  _: number,
  chainId: number
): number => {
  const sortedBlockNumber = [...blockNumbers].sort((a, b) => b - a);
  const firstBlockNumber = sortedBlockNumber.at(-1)!;
  const secondBlockNumber = sortedBlockNumber.at(-2);

  const { avgBlockTimeMs } = getChainConfigByChainId(
    getLocalChainConfigs(),
    chainId
  );
  const acceptableBlockDiff = Math.ceil(
    ACCEPTABLE_BLOCK_DIFF_IN_MS / avgBlockTimeMs
  );

  if (!secondBlockNumber) {
    return firstBlockNumber;
  } else if (firstBlockNumber - secondBlockNumber > acceptableBlockDiff) {
    return firstBlockNumber;
  } else {
    return secondBlockNumber;
  }
};

const allProviders = RPC_URLS.map(
  (url) =>
    new providers.StaticJsonRpcProvider(url, { chainId: CHAIN_ID, name: "xd" })
);

const providerWithAgreement = new ProviderWithAgreement(allProviders, {
  electBlockFn: electBlock,
  ignoreAgreementOnInsufficientResponses: true,
});

const times: number[] = [];

async function main() {
  console.time("blockNumber");
  const blockTag = await providerWithAgreement.getBlockNumber();
  console.timeEnd("blockNumber");

  console.time("call");
  const start = performance.now();
  await providerWithAgreement.call(TRANSACTION, blockTag);
  const end = performance.now();
  console.timeEnd("call");
  times.push(end - start);
}

void (async () => {
  for (let i = 0; i < 10; i++) {
    await main();
  }
  console.log(times, _.mean(times));
})();
