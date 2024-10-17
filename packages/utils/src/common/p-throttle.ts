// CODE COPIED FROM https://www.npmjs.com/package/p-throttle
// we can't use it via npm cause of error Error [ERR_REQUIRE_ESM]: require() of ES Module

/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...arguments_: readonly any[]) => unknown;

export type ThrottledFunction<F extends AnyFunction> = F & {
  /**
	Whether future function calls should be throttled or count towards throttling thresholds.

	@default true
	*/
  isEnabled: boolean;

  /**
	The number of queued items waiting to be executed.
	*/
  readonly queueSize: number;

  /**
	Abort pending executions. All unresolved promises are rejected with a `pThrottle.AbortError` error.
	*/
  abort(): void;
};

export type Options = {
  /**
	The maximum number of calls within an `interval`.
	*/
  readonly limit: number;

  /**
	The timespan for `limit` in milliseconds.
	*/
  readonly interval: number;

  /**
	Use a strict, more resource intensive, throttling algorithm. The default algorithm uses a windowed approach that will work correctly in most cases, limiting the total number of calls at the specified limit per interval window. The strict algorithm throttles each call individually, ensuring the limit is not exceeded for any interval.

	@default false
	*/
  readonly strict?: boolean;

  /**
	Get notified when function calls are delayed due to exceeding the `limit` of allowed calls within the given `interval`.

 	Can be useful for monitoring the throttling efficiency.

	@example
	```
	import pThrottle from 'p-throttle';

	const throttle = pThrottle({
		limit: 2,
		interval: 1000,
		onDelay: () => {
			console.log('Reached interval limit, call is delayed');
		},
	});

	const throttled = throttle(() => {
 		console.log('Executing...');
   	});

	await throttled();
	await throttled();
	await throttled();
	//=> Executing...
	//=> Executing...
	//=> Reached interval limit, call is delayed
	//=> Executing...
	```
	*/
  readonly onDelay?: () => void;
};

export const pThrottle = ({
  limit,
  interval,
  strict,
  onDelay,
}: Options): (<F extends AnyFunction>(
  function_: F
) => ThrottledFunction<F>) => {
  if (!Number.isFinite(limit)) {
    throw new TypeError("Expected `limit` to be a finite number");
  }

  if (!Number.isFinite(interval)) {
    throw new TypeError("Expected `interval` to be a finite number");
  }

  const queue = new Map();

  let currentTick = 0;
  let activeCount = 0;

  function windowedDelay() {
    const now = Date.now();

    if (now - currentTick > interval) {
      activeCount = 1;
      currentTick = now;
      return 0;
    }

    if (activeCount < limit) {
      activeCount++;
    } else {
      currentTick += interval;
      activeCount = 1;
    }

    return currentTick - now;
  }

  const strictTicks: number[] = [];

  function strictDelay() {
    const now = Date.now();

    // Clear the queue if there's a significant delay since the last execution
    if (strictTicks.length > 0 && now - strictTicks.at(-1)! > interval) {
      strictTicks.length = 0;
    }

    // If the queue is not full, add the current time and execute immediately
    if (strictTicks.length < limit) {
      strictTicks.push(now);
      return 0;
    }

    // Calculate the next execution time based on the first item in the queue
    const nextExecutionTime = strictTicks[0] + interval;

    // Shift the queue and add the new execution time
    strictTicks.shift();
    strictTicks.push(nextExecutionTime);

    // Calculate the delay for the current execution
    return Math.max(0, nextExecutionTime - now);
  }

  const getDelay = strict ? strictDelay : windowedDelay;

  //@ts-ignore
  return (function_) => {
    const throttled = function (...arguments_: unknown[]) {
      if (!throttled.isEnabled) {
        // @ts-ignore
        return (async () => function_.apply(this, arguments_))();
      }

      let timeoutId: NodeJS.Timeout;
      return new Promise((resolve, reject) => {
        const execute = () => {
          // @ts-ignore
          resolve(function_.apply(this, arguments_));
          queue.delete(timeoutId);
        };

        const delay = getDelay();
        if (delay > 0) {
          timeoutId = setTimeout(execute, delay);
          queue.set(timeoutId, reject);
          onDelay?.();
        } else {
          execute();
        }
      });
    };

    // throttled.abort = () => {
    //   for (const timeout of queue.keys()) {
    //     clearTimeout(timeout);
    //     queue.get(timeout)(new Error("aborted"));
    //   }

    //   queue.clear();
    //   strictTicks.splice(0, strictTicks.length);
    // };

    throttled.isEnabled = true;

    Object.defineProperty(throttled, "queueSize", {
      get() {
        return queue.size;
      },
    });

    return throttled;
  };
};

export function withRateLimiter<T extends AnyFunction>(
  fn: T,
  pThrottleOpts: Options
): T {
  const limiter = pThrottle(pThrottleOpts);

  return limiter(fn);
}
