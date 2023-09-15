import { formatBytes32String } from "ethers/lib/utils";
import { getAdapterContract } from "../../src/core/contract-interactions/get-contract";
import { MentoAdapterBase } from "../../typechain-types";

// Usage: yarn run-script src/scripts/mento/register-data-feeds.ts
// Note! You should configure the .env file properly before running this script

// Alfajorez data feeds
const DATA_FEEDS = {
  // CUSD: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
  // EUR: "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F",

  CELO: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
  USDC: "0xA1A8003936862E7a15092A91898D69fa8bCE290c",
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  const mentoAdapterContract = getAdapterContract() as MentoAdapterBase;
  for (const [symbol, tokenAddress] of Object.entries(DATA_FEEDS)) {
    console.log(`Registering data feed: `, { symbol, tokenAddress });
    const dataFeedIdBytes32 = formatBytes32String(symbol);
    const tx = await mentoAdapterContract.setDataFeed(
      dataFeedIdBytes32,
      tokenAddress,
    );
    console.log(`Tx sent: ${tx.hash}`);
    await tx.wait();
    console.log(`Tx confirmed: ${tx.hash}`);
  }
})();
