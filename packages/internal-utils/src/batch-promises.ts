import { RedstoneCommon } from "@redstone-finance/utils";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function batchPromises<T>(
  batchSize: number,
  msBetweenBatches: number,
  promises: (() => Promise<T>)[],
  failOnError = false
): Promise<T[]> {
  const results: T[] = [];
  const errors: Error[] = [];
  for (let i = 0; i < promises.length; i += batchSize) {
    if (i !== 0) {
      await sleep(msBetweenBatches);
    }
    const batch = promises.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(batch.map((f) => f()));
    const filteredResults = batchResults.filter(
      (result) => result.status === "fulfilled"
    ) as PromiseFulfilledResult<T>[];
    results.push(...filteredResults.map((result) => result.value));
    const filteredErrors = batchResults.filter(
      (result) => result.status === "rejected"
    );
    errors.push(...filteredErrors.map((r) => r.reason as Error));
  }
  if (errors.length > 0) {
    if (failOnError) {
      throw new AggregateError(errors, "batch operation failed");
    } else {
      console.log(
        RedstoneCommon.stringifyError(
          new AggregateError(errors, "batch operation failed")
        )
      );
    }
  }

  return results;
}
