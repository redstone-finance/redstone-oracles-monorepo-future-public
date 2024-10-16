import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { getDataPackagesResponse } from "../helpers";

const handlers = [
  http.get(
    "http://mock-cache-service/data-packages/latest/redstone-main-demo",
    () => {
      return HttpResponse.json(getDataPackagesResponse());
    }
  ),
];

export const server = setupServer(...handlers);
