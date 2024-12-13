import {
  DataPackage,
  DataPoint,
  NumericDataPoint,
  utils,
} from "@redstone-finance/protocol";
import { filterOutliers } from "../src/outlier-detection";

describe("outlier-detection", () => {
  const timestamp = Date.now();
  const createMockDataPackage = (value: number) => {
    const dataPackage = new DataPackage(
      [new NumericDataPoint({ dataFeedId: "TEST", value })],
      timestamp,
      "test-source"
    );
    return dataPackage.toObj();
  };

  it("should return empty object for empty input", () => {
    const result = filterOutliers({});
    expect(result).toEqual({});
  });

  it("should not filter when less than 3 packages", () => {
    const packages = {
      TEST: [createMockDataPackage(100), createMockDataPackage(200)],
    };
    const result = filterOutliers(packages);
    expect(result).toEqual(packages);
  });

  it("should filter out single outlier", () => {
    const packages = {
      TEST: [
        createMockDataPackage(100),
        createMockDataPackage(101),
        createMockDataPackage(102),
        createMockDataPackage(200), // outlier
      ],
    };

    const result = filterOutliers(packages);
    expect(result.TEST.length).toBe(3);
    expect(
      result.TEST.find((pkg) => pkg.dataPoints[0].value === 200)
    ).toBeUndefined();
  });

  it("should not filter when no clear outliers", () => {
    const packages = {
      TEST: [
        createMockDataPackage(100),
        createMockDataPackage(102),
        createMockDataPackage(103),
        createMockDataPackage(104),
      ],
    };

    const result = filterOutliers(packages);
    expect(result.TEST.length).toBe(4);
  });

  it("should handle multiple data feed ids", () => {
    const packages = {
      BTC: [
        createMockDataPackage(40000),
        createMockDataPackage(41000),
        createMockDataPackage(42000),
        createMockDataPackage(80000), // outlier
      ],
      ETH: [
        createMockDataPackage(2000),
        createMockDataPackage(2100),
        createMockDataPackage(2200),
      ],
    };

    const result = filterOutliers(packages);
    expect(result.BTC.length).toBe(3);
    expect(result.ETH.length).toBe(3);
  });

  it("should ignore packages with multiple data points", () => {
    const regularPackage = createMockDataPackage(100);
    const multiPointPackage = new DataPackage(
      [
        new NumericDataPoint({ dataFeedId: "TEST1", value: 100 }),
        new NumericDataPoint({ dataFeedId: "TEST2", value: 200 }),
      ],
      timestamp,
      "test-source"
    ).toObj();

    const packages = {
      TEST: [
        regularPackage,
        regularPackage,
        multiPointPackage,
        createMockDataPackage(200), // outlier
      ],
    };

    const result = filterOutliers(packages);
    expect(result.TEST.length).toBe(packages.TEST.length);
  });

  it("should not filter when multiple values deviate", () => {
    const packages = {
      TEST: [
        createMockDataPackage(100),
        createMockDataPackage(101),
        createMockDataPackage(200), // deviant
        createMockDataPackage(201), // deviant
      ],
    };

    const result = filterOutliers(packages);
    expect(result.TEST.length).toBe(4);
  });

  it("should not filter when encountering non-numeric data points", () => {
    const packages = {
      TEST: [
        createMockDataPackage(100),
        createMockDataPackage(101),
        createMockDataPackage(202),
        // Create a package with a non-numeric value
        new DataPackage(
          [new DataPoint("TEST", utils.convertNumberToBytes(1.2, 8, 32))],
          timestamp,
          "test-source"
        ).toObj(),
      ],
    };

    const result = filterOutliers(packages);
    expect(result.TEST.length).toBe(4);
  });
});
