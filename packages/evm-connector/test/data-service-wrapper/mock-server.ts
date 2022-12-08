import { setupServer } from "msw/node";
import { rest } from "msw";
import { mockSignedDataPackageObjects } from "../tests-common";

const singedDataPackageObj = mockSignedDataPackageObjects;

const getDataPackageResponse = (dataFeedId: string) =>
  singedDataPackageObj.filter(
    (obj) =>
      obj.dataPoints.filter((dp) => dp.dataFeedId === dataFeedId).length > 0
  );

const getValidDataPackagesResponse = () => ({
  ETH: getDataPackageResponse("ETH"),
  BTC: getDataPackageResponse("BTC"),
});

const handlers = [
  rest.get(
    "http://valid-cache.com/data-packages/latest",
    async (req, res, ctx) => {
      return res(ctx.json(getValidDataPackagesResponse()));
    }
  ),
  rest.get(
    "http://invalid-cache.com/data-packages/latest",
    async (req, res, ctx) => {
      return res(
        ctx.json({
          ETH: getDataPackageResponse("ETH").map((obj) => ({
            ...obj,
            timestampMilliseconds: 1654353411111,
          })),
          BTC: getDataPackageResponse("BTC").map((obj) => ({
            ...obj,
            timestampMilliseconds: 1654353411111,
          })),
        })
      );
    }
  ),
  rest.get(
    "http://slower-cache.com/data-packages/latest",
    async (req, res, ctx) => {
      return res(ctx.delay(200), ctx.json(getValidDataPackagesResponse()));
    }
  ),
];

export const server = setupServer(...handlers);
