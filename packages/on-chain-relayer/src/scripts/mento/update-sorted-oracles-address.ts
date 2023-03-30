import { getAdapterContract } from "../../core/contract-interactions/get-contract";

// Usage: yarn run-script src/scripts/mento/update-sorted-oracles-address.ts
// Note! You should configure the .env file properly before running this script

const NEW_SORTED_ORACLES_ADDRESS = "0xFdd8bD58115FfBf04e47411c1d228eCC45E93075";

(async () => {
  const mentoAdapterContract = getAdapterContract();

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
