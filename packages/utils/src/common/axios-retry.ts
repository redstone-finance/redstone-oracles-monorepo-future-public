import axios from "axios";
import { retry } from "./retry";

export async function axiosGetWithRetries<T>(
  url: string,
  retryLimit: number,
  retryDelayMilliseconds?: number
): Promise<T> {
  return (await retry({
    fn: async () => await axios.get(url),
    fnName: `axios.get`,
    maxRetries: retryLimit,
    waitBetweenMs: retryDelayMilliseconds,
  })()) as T;
}
