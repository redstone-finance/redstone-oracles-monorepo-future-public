import axios, { AxiosResponse, RawAxiosRequestHeaders } from "axios";
import { RetryConfig, retry } from "./retry";

export type AxiosGetWithRetriesConfig = {
  timeout?: number;
  headers?: RawAxiosRequestHeaders;
} & Omit<RetryConfig, "fn">;

export async function axiosGetWithRetries<T>(
  url: string,
  config: AxiosGetWithRetriesConfig
): Promise<AxiosResponse<T>> {
  return await retry({
    fnName: config.fnName ?? "axios.get",
    fn: async () =>
      await axios.get<T>(url, {
        timeout: config.timeout,
        headers: config.headers,
      }),
    ...config,
  })();
}
