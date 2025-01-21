import type { AnchorProvider } from "@coral-xyz/anchor";
import { requestRedstonePayload } from "@redstone-finance/sdk";

export interface PriceData {
  feedId: string;
  value: string;
  timestamp: string;
  writeTimestamp: string;
}

export const makeFeedIdBytes = (feedId: string) => {
  return Buffer.from(feedId.padEnd(32, "\0"));
};

export const makePriceSeed = () => {
  return Buffer.from("price".padEnd(32, "\0"));
};

export const makePayload = async (dataPackagesIds: Array<string>) => {
  const DATA_SERVICE_ID = "redstone-primary-prod";
  const UNIQUE_SIGNER_COUNT = 3;

  const res = await requestRedstonePayload(
    {
      dataPackagesIds,
      dataServiceId: DATA_SERVICE_ID,
      uniqueSignersCount: UNIQUE_SIGNER_COUNT,
    },
    "bytes"
  );

  const payload = Buffer.from(JSON.parse(res));

  console.log("Payload size:", payload.length);

  return payload;
};

// Utility function to print compute units used by a transaction
export async function printComputeUnitsUsed(
  provider: AnchorProvider,
  txSignature: string
) {
  const maxRetries = 5;
  const cooldownMs = 200;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const tx = await provider.connection.getTransaction(txSignature, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      });
      if (tx && tx.meta && tx.meta.computeUnitsConsumed) {
        console.log(`Compute units used: ${tx.meta.computeUnitsConsumed}`);
        return; // Success, exit the function
      }
    } catch (error) {
      // pass
    }

    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, cooldownMs));
    }
  }

  console.log(`Failed to retrieve compute units after ${maxRetries} attempts`);
}
