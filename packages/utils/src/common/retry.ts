import { sleep } from "./time";

export type RetryConfig<T extends (...args: unknown[]) => Promise<unknown>> = {
  fn: T;
  maxRetries: number;
  waitBetweenMs?: number;
  disableLog?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function retry<T extends (...args: any[]) => Promise<unknown>>(
  config: RetryConfig<T>
) {
  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    let lastError: unknown;
    for (let i = 0; i < config.maxRetries; i++) {
      try {
        return await (config.fn(...args) as Promise<ReturnType<T>>);
      } catch (e) {
        lastError = e;
        if (!config.disableLog) {
          console.log(
            `Function ${config.fn.name} failed. Retrying ${i}/${
              config.maxRetries
            } after ${config.waitBetweenMs || 0}`
          );
        }
        // don't wait in last iteration
        if (config.waitBetweenMs && i === config.maxRetries - 1) {
          await sleep(config.waitBetweenMs);
        }
      }
    }
    if (!config.disableLog) {
      `Function ${config.fn.name} failed after ${config.maxRetries} attempts`;
    }
    throw lastError;
  };
}
