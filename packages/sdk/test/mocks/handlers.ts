import { rest } from "msw";
import { DEFAULT_CACHE_SERVICE_URLS } from "../../src";
import { mockSignedDataPackages } from "./mock-packages";

export const handlers = [
  ...DEFAULT_CACHE_SERVICE_URLS,
  "https://bad-url-1.com",
  "https://bad-url-2.com",
].map((url) =>
  rest.get(url + "/data-packages/latest", (req, res, ctx) => {
    if (req.url.origin.includes("bad-url")) {
      return res(ctx.status(400), ctx.json(null));
    } else {
      return res(ctx.status(200), ctx.json(mockSignedDataPackages));
    }
  })
);
