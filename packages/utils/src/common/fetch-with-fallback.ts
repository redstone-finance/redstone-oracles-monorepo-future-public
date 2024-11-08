import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

export type AxiosGetRequest<T> = {
  urls: string[];
  axiosConfig?: AxiosRequestConfig;
  makeGetRequest?: (
    url: string,
    axiosConfig?: AxiosRequestConfig
  ) => Promise<AxiosResponse<T>>;
};

export const fetchWithFallbacks = <T>(
  args: AxiosGetRequest<T>
): Promise<AxiosResponse<T>> => {
  const makeGetRequest = args.makeGetRequest ?? axios.get.bind(axios);

  const requests = args.urls.map((url) =>
    makeGetRequest(url, args.axiosConfig)
  );
  return Promise.any(requests);
};
