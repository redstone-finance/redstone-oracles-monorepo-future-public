import axios from "axios";
import { retry } from "./retry";

export async function axiosGetWithRetries<T>(args: {
  url: string;
  retryLimit: number;
  retryDelayMilliseconds?: number;
  timeout?: number;
}): Promise<T> {
  return (await retry({
    fn: async () => await axios.get(args.url, { timeout: args.timeout }),
    fnName: `axios.get`,
    maxRetries: args.retryLimit,
    waitBetweenMs: args.retryDelayMilliseconds,
  })()) as T;
}
