import axios, { AxiosRequestConfig } from "axios";

export type AxiosGetRequest = {
  urls: string[];
  axiosConfig?: AxiosRequestConfig<any>;
};

export const fetchWithFallbacks = async <T>(args: AxiosGetRequest) => {
  const requests = args.urls.map((url) => axios.get<T>(url, args.axiosConfig));

  const response = await Promise.any(requests);

  return response;
};
