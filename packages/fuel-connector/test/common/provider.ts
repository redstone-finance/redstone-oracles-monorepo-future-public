import { Provider } from "fuels";

const IS_LOCAL = true as boolean;

export const LOCAL_NODE_URL = "http://127.0.0.1:4000/v1/graphql";
export const provider = async () =>
  IS_LOCAL ? undefined : await Provider.create(LOCAL_NODE_URL);
