import { getAdapterContract } from "../../src/core/contract-interactions/get-contract";
import { MentoAdapterBase } from "../../typechain-types";

// Usage: yarn run-script src/scripts/mento/update-sorted-oracles-address.ts
// Note! You should configure the .env file properly before running this script

const NEW_SORTED_ORACLES_ADDRESS = "0xFdd8bD58115FfBf04e47411c1d228eCC45E93075";

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  const mentoAdapterContract = getAdapterContract() as MentoAdapterBase;

  console.log(
    `Updating sorted oracle address to: ${NEW_SORTED_ORACLES_ADDRESS}`
  );
  const tx = await mentoAdapterContract.updateSortedOraclesAddress(
    NEW_SORTED_ORACLES_ADDRESS
  );

  console.log(`Tx sent: ${tx.hash}`);
  await tx.wait();
  console.log(`Tx confirmed: ${tx.hash}`);
})();
