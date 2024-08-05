import axios, { Axios, AxiosResponse, RawAxiosRequestHeaders } from "axios";
import { retry, RetryConfig } from "./retry";

export type AxiosGetWithRetriesConfig = {
  timeout?: number;
  headers?: RawAxiosRequestHeaders;
  params?: unknown;
} & Omit<RetryConfig, "fn">;

export async function axiosGetWithRetries<T>(
  url: string,
  config: AxiosGetWithRetriesConfig,
  axiosInstance: Axios = axios
): Promise<AxiosResponse<T>> {
  return await retry({
    fnName: config.fnName ?? "axios.get",
    fn: async () =>
      await axiosInstance.get<T>(url, {
        timeout: config.timeout,
        headers: config.headers,
        params: config.params,
      }),
    ...config,
  })();
}
