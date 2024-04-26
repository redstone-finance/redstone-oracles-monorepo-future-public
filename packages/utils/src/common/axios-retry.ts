import axios, { AxiosResponse, RawAxiosRequestHeaders } from "axios";
import { RetryConfig, retry } from "./retry";

export type AxiosGetWithRetriesConfig = {
  timeout?: number;
  maxRetries: number;
  headers?: RawAxiosRequestHeaders;
} & Partial<RetryConfig<(...args: unknown[]) => Promise<unknown>>>;

export async function axiosGetWithRetries<T>(
  url: string,
  config: AxiosGetWithRetriesConfig
): Promise<AxiosResponse<T>> {
  return await retry({
    ...config,
    fn: async () =>
      await axios.get<T>(url, {
        timeout: config.timeout,
        headers: config.headers,
      }),
    fnName: `axios.get`,
  })();
}
