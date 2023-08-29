import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

export type AxiosGetRequest = {
  urls: string[];
  axiosConfig?: AxiosRequestConfig;
};

export const fetchWithFallbacks = <T>(
  args: AxiosGetRequest
): Promise<AxiosResponse<T>> => {
  const requests = args.urls.map((url) => axios.get<T>(url, args.axiosConfig));
  return Promise.any(requests);
};
