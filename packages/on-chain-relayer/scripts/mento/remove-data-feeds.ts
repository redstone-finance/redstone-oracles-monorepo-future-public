import { formatBytes32String } from "ethers/lib/utils";
import { getAdapterContract } from "../../src/core/contract-interactions/get-contract";
import { MentoAdapterBase } from "../../typechain-types";

// Usage: yarn run-script src/scripts/mento/remove-data-feeds.ts
// Note! You should configure the .env file properly before running this script

const DATA_FEEDS = ["CUSD", "EUR"];

(async () => {
  const mentoAdapterContract = getAdapterContract() as MentoAdapterBase;
  for (const dataFeedId of DATA_FEEDS) {
    console.log(`Removing data feed: ${dataFeedId}`);
    const dataFeedIdBytes32 = formatBytes32String(dataFeedId);
    const tx = await mentoAdapterContract.removeDataFeed(dataFeedIdBytes32);
    console.log(`Tx sent: ${tx.hash}`);
    await tx.wait();
    console.log(`Tx confirmed: ${tx.hash}`);
  }
})();
