type TimeoutCallback<T> = (
  resolve: (value: T | PromiseLike<T>) => void,
  reject: (reason?: unknown) => void
) => void;

export const timeout = async <T>(
  prom: Promise<T>,
  timeoutMS: number,
  customErrorMessage?: string,
  timeoutCallback?: TimeoutCallback<T>
): Promise<T> => {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race<T>([
      prom,
      new Promise(
        (resolve, reject) =>
          (timer = setTimeout(() => {
            if (timeoutCallback) {
              return timeoutCallback(resolve, reject);
            }
            reject(
              new Error(customErrorMessage ?? `Timeout error ${timeoutMS} [MS]`)
            );
          }, timeoutMS))
      ),
    ]);
  } finally {
    clearTimeout(timer);
  }
};

export const sleep = (ms: number) =>
  new Promise((resolve, _rejects) => setTimeout(resolve, ms));

export const msToMin = (ms: number) => ms / 60_000;

export const minToMs = (min: number) => min * 60_000;

export const hourToMs = (hours: number) => hours * 3_600_000;

export const msToHours = (ms: number) => ms / 3_600_000;
