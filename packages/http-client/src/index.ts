import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import axiosRetry, { isNetworkError, isRetryableError } from "axios-retry";
import { Agent as HttpAgent } from "node:http";
import { Agent as HttpsAgent } from "node:https";

export type HttpClientOptions = {
  /**
   * [node only]
   * How many concurrent sockets per hostname should this http client handle
   */
  maxSockets: number;

  /**
   * [node only]
   * Maximum number of all sockets. This should be mainly limited by machine resources.
   */
  maxTotalSockets: number;

  /**
   * [node only]
   * For how long socket should be kept alive
   */
  keepAliveMsecs: number;

  /**
   * [node only]
   * Set to true if you make subsequent requests
   */
  keepAlive: boolean;

  /**
   * [node only]
   * For high request rate use fifo it will maximize the number of open sockets.
   * To reduce opened sockets count use lifo
   */
  scheduling: "lifo" | "fifo";

  /**
   * [node only]
   * defines the max size of the http response content in bytes allowed in node.js
   */
  maxContentLength: number;

  /**
   * timeout in ms
   */
  timeout: number;

  /**
   *  It retries if it is a network error or a 5xx error
   */
  retryOptions?: {
    retries: number;
    backOffBase?: number;
    delayMs: number;
  };
};

const isNode =
  typeof process !== "undefined" &&
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  process.versions != null &&
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  process.versions.node != null;

/**
 * This class should be initialized statically on the top level to avoid garbage collection and benefit from sockets reusability
 *
 */
export class HttpClient {
  public httpsAgent?: HttpsAgent;
  public httpAgent?: HttpAgent;
  private axiosInstance: AxiosInstance;

  constructor(httpClientOptions: HttpClientOptions) {
    if (isNode) {
      /** https://nodejs.org/api/http.html#new-agentoptions */
      this.httpsAgent = new HttpsAgent({
        maxSockets: httpClientOptions.maxSockets,
        maxTotalSockets: httpClientOptions.maxTotalSockets,
        keepAlive: true,
        keepAliveMsecs: httpClientOptions.keepAliveMsecs,
        scheduling: httpClientOptions.scheduling,
      });
      this.httpAgent = new HttpAgent({
        maxSockets: httpClientOptions.maxSockets,
        maxTotalSockets: httpClientOptions.maxTotalSockets,
        keepAlive: true,
        keepAliveMsecs: httpClientOptions.keepAliveMsecs,
        scheduling: httpClientOptions.scheduling,
      });
    }

    this.axiosInstance = axios.create({
      httpsAgent: this.httpsAgent,
      httpAgent: this.httpAgent,
      timeout: httpClientOptions.timeout,
      maxContentLength: httpClientOptions.maxContentLength,
    });

    if (httpClientOptions.retryOptions) {
      axiosRetry(this.axiosInstance, {
        retries: httpClientOptions.retryOptions.retries,
        retryCondition: (axiosError: AxiosError) =>
          isRetryableError(axiosError) || isNetworkError(axiosError),
        retryDelay: (retryCount: number) =>
          Math.pow(
            httpClientOptions.retryOptions?.backOffBase ?? 1,
            retryCount
          ) * httpClientOptions.retryOptions!.delayMs,
      });
    }
  }

  get<R>(urlSuffix: string, config?: AxiosRequestConfig) {
    return this.axiosInstance.get<R>(urlSuffix, config);
  }

  post<R>(urlSuffix: string, body: unknown, config: AxiosRequestConfig) {
    return this.axiosInstance.post<R>(urlSuffix, body, config);
  }
}
