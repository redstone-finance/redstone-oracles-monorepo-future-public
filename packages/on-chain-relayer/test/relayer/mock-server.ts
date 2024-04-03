import { rest } from "msw";
import { setupServer } from "msw/node";
import { getDataPackagesResponse } from "../helpers";

const handlers = [
  rest.get(
    "http://mock-cache-service/data-packages/latest/redstone-main-demo",
    async (req, res, ctx) => {
      return await res(ctx.json(getDataPackagesResponse()));
    }
  ),
];

export const server = setupServer(...handlers);
