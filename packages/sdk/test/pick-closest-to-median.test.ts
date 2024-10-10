import {
  DataPackage,
  NumericDataPoint,
  SignedDataPackagePlainObj,
} from "@redstone-finance/protocol";
import { ethers } from "ethers";
import { pickDataFeedPackagesClosestToMedian } from "../src/pick-closest-to-median";

const MOCK_WALLET_1 = new ethers.Wallet(
  "0xfae81e7c122f2ad245be182d88889e6a037bbeebd7de7bb5ca10f891d359e440"
);

function createMockDataPackage(values: number[]): SignedDataPackagePlainObj {
  const dataPackage = new DataPackage(
    values.map(
      (value, index) =>
        new NumericDataPoint({
          dataFeedId: "ETH" + index,
          value,
        })
    ),
    1,
    "ETH"
  );

  return dataPackage.sign(MOCK_WALLET_1.privateKey).toObj();
}

describe("pickDataFeedPackagesClosestToMedian", () => {
  const defineTestCase = (
    values: number[][],
    count: number,
    expected: number[][]
  ) => {
    it(`${JSON.stringify(values)} => ${JSON.stringify(expected)}`, () => {
      const mockPackages = values.map((value) => createMockDataPackage(value));

      const result = pickDataFeedPackagesClosestToMedian(mockPackages, count);

      expect(
        result.map((dp) =>
          dp.dataPackage.dataPoints.map((p) => p.toObj().value)
        )
      ).toEqual(expected);
    });
  };

  defineTestCase([[0.99], [1], [1], [1], [1.5]], 4, [[1], [1], [1], [0.99]]);

  defineTestCase([[0.99], [1], [1], [1]], 3, [[1], [1], [1]]);

  defineTestCase([[0.99], [1], [1], [1]], 1, [[1]]);

  defineTestCase([[0.99], [1], [1], [1]], 1, [[1]]);

  defineTestCase([[0.99], [1.1], [1.1], [1.02]], 2, [[1.1], [1.1]]);

  defineTestCase(
    [
      [1.01, 110],
      [1, 100],
      [0.995, 95],
    ],
    2,
    [
      [1, 100],
      [0.995, 95],
    ]
  );

  defineTestCase(
    [
      [1.1, 101],
      [1, 100],
      [0.5, 99.5],
    ],
    2,
    [
      [1, 100],
      [1.1, 101],
    ]
  );
});
