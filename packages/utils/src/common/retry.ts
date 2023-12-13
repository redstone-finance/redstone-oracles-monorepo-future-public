import { sleep } from "./time";

export type RetryConfig<T extends (...args: unknown[]) => Promise<unknown>> = {
  fn: T;
  maxRetries: number;
  waitBetweenMs?: number;
  disableLog?: boolean;
  backOff?: {
    backOffBase: number;
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function retry<T extends (...args: any[]) => Promise<unknown>>(
  config: RetryConfig<T>
) {
  if (config.maxRetries === 0) {
    throw new Error(
      `Setting ${config.maxRetries} to 0 will never call underlying function`
    );
  }
  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const error = new AggregateError(
      `Retry failed after ${config.maxRetries} attempts`
    );
    for (let i = 0; i < config.maxRetries; i++) {
      try {
        return await (config.fn(...args) as Promise<ReturnType<T>>);
      } catch (e) {
        error.errors.push(e);

        // don't wait in last iteration
        if (config.waitBetweenMs && i !== config.maxRetries - 1) {
          const sleepTimeBackOffMultiplier = config.backOff
            ? Math.pow(config.backOff.backOffBase, i)
            : 1;
          const sleepTime = config.waitBetweenMs * sleepTimeBackOffMultiplier;

          await sleep(sleepTime);
        }

        if (!config.disableLog) {
          console.log(
            `Function ${config.fn.name} failed. Retrying ${i + 1}/${
              config.maxRetries
            }`
          );
        }
      }
    }
    throw error;
  };
}
