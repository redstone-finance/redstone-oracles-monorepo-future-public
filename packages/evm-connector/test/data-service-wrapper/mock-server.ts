import { rest } from "msw";
import { setupServer } from "msw/node";
import { mockSignedDataPackageObjects } from "../tests-common";

const singedDataPackageObj = mockSignedDataPackageObjects;

const getDataPackageResponse = (dataFeedId: string) =>
  singedDataPackageObj
    .filter(
      (obj) =>
        obj.dataPoints.filter((dp) => dp.dataFeedId === dataFeedId).length > 0
    )
    .map((obj) => ({
      ...obj,
      dataFeedId,
    }));

const getValidDataPackagesResponse = () => ({
  ETH: getDataPackageResponse("ETH"),
  BTC: getDataPackageResponse("BTC"),
});

const handlers = [
  rest.get(
    "http://valid-cache.com/data-packages/latest/*",
    async (req, res, ctx) => {
      return await res(ctx.json(getValidDataPackagesResponse()));
    }
  ),
  rest.get(
    "http://invalid-cache.com/data-packages/latest/*",
    async (req, res, ctx) => {
      return await res(
        ctx.json({
          ETH: getDataPackageResponse("ETH").map((obj) => ({
            ...obj,
            dataPoints: [{ ...obj.dataPoints[0], value: 1 }],
          })),
          BTC: getDataPackageResponse("BTC").map((obj) => ({
            ...obj,
            dataPoints: [{ ...obj.dataPoints[0], value: 1 }],
          })),
        })
      );
    }
  ),
  rest.get(
    "http://slower-cache.com/data-packages/latest/*",
    async (req, res, ctx) => {
      return await res(
        ctx.delay(200),
        ctx.json(getValidDataPackagesResponse())
      );
    }
  ),
];

export const server = setupServer(...handlers);
