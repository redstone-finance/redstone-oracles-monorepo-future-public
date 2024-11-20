import {
  DataPackagesRequestParams,
  DataPackagesResponseCache,
  isConforming,
  isSubsetOf,
} from "../src";
import { mockSignedDataPackagesResponse } from "./mocks/mock-packages";

describe("DataPackagesResponseCache tests", () => {
  let sut: DataPackagesResponseCache;
  const mockRequestParams: DataPackagesRequestParams = {
    dataServiceId: "redstone-primary-prod",
    dataPackagesIds: ["ETH", "BTC"],
    uniqueSignersCount: 2,
  };

  beforeEach(() => {
    sut = new DataPackagesResponseCache();
  });

  it("should return undefined when cache is empty", () => {
    const result = sut.get(mockRequestParams);

    expect(result).toBeUndefined();
  });

  it("should return cached response when request params match", () => {
    sut.update(mockSignedDataPackagesResponse, mockRequestParams);
    const result = sut.get(mockRequestParams);

    expect(result).toEqual(mockSignedDataPackagesResponse);
  });

  it("should return undefined when request params do not conform to cached value", () => {
    sut.update(mockSignedDataPackagesResponse, mockRequestParams);
    const differentRequestParams = {
      ...mockRequestParams,
      dataPackagesIds: ["XXX"],
    };

    const result = sut.get(differentRequestParams);
    expect(result).toBeUndefined();
  });

  it("should return cached response filtered by dataPackageIds", () => {
    sut.update(mockSignedDataPackagesResponse, mockRequestParams);
    const modifiedRequestParams = {
      ...mockRequestParams,
      dataPackagesIds: ["ETH"],
    };
    const result = sut.get(modifiedRequestParams);

    expect(result).toEqual({ ETH: mockSignedDataPackagesResponse["ETH"] });
  });
});

describe("isConforming tests", () => {
  const thisRequestParams: DataPackagesRequestParams = {
    dataServiceId: "service",
    dataPackagesIds: ["ETH"],
    uniqueSignersCount: 1,
    ignoreMissingFeed: true,
  };

  it("should return true if ignoreMissingFeed is true", () => {
    for (const otherPrams of [
      { ...thisRequestParams },
      { ...thisRequestParams, dataPackagesIds: ["BTC", "ETH"] },
      { ...thisRequestParams, dataPackagesIds: ["BTC"] },
    ]) {
      expect(isConforming(thisRequestParams, otherPrams, ["BTC"])).toBe(true);
      expect(isConforming(thisRequestParams, otherPrams, ["ETH"])).toBe(true);
      expect(isConforming(thisRequestParams, otherPrams, ["ETH", "BTC"])).toBe(
        true
      );
    }
  });

  it("should return true if ignoreMissingFeed is false, but current response conforms", () => {
    const thisNewParams = { ...thisRequestParams, ignoreMissingFeed: false };

    for (const otherPrams of [
      { ...thisNewParams },
      { ...thisNewParams, dataPackagesIds: ["BTC"] },
      { ...thisNewParams, dataPackagesIds: ["BTC", "ETH"] },
    ]) {
      expect(isConforming(thisNewParams, otherPrams, ["ETH", "BTC"])).toBe(
        true
      );
    }
  });

  it("should return false ignoreMissingFeed is false, but current doesn't conform", () => {
    const thisNewParams = {
      ...thisRequestParams,
      dataPackagesIds: ["ETH", "BTC"],
      ignoreMissingFeed: false,
    };

    expect(isConforming(thisNewParams, { ...thisNewParams }, ["BTC"])).toBe(
      false
    );
  });

  it("should return false if one of important request params is not equal", () => {
    for (const otherPrams of [
      { ...thisRequestParams, dataServiceId: "other-service" },
      { ...thisRequestParams, uniqueSignersCount: 2 },
      { ...thisRequestParams, authorizedSigners: ["0x00"] },
      { ...thisRequestParams, maxTimestampDeviationMS: 123 },
      { ...thisRequestParams, historicalTimestamp: 123 },
      { ...thisRequestParams, ignoreMissingFeed: false },
    ]) {
      expect(isConforming(thisRequestParams, otherPrams, ["ETH"])).toBe(false);
    }
  });

  it("should return true if one of not important request params is not equal", () => {
    for (const otherPrams of [
      { ...thisRequestParams, waitForAllGatewaysTimeMs: 123 },
      { ...thisRequestParams, urls: ["https://"] },
      { ...thisRequestParams, enableEnhancedLogs: true },
    ]) {
      expect(isConforming(thisRequestParams, otherPrams, ["ETH"])).toBe(true);
    }
  });
});

describe("isSubsetOf tests", () => {
  it("should return true if subset is contained in superset", () => {
    const superset = new Set(["a", "b", "c"]);
    const subset = new Set(["a", "b"]);

    expect(isSubsetOf(superset, subset)).toBe(true);
  });

  it("should return true if subset is empty", () => {
    const superset = new Set(["a", "b", "c"]);
    const subset = new Set();

    expect(isSubsetOf(superset, subset)).toBe(true);
  });

  it("should return false if subset is not contained in superset", () => {
    const superset = new Set(["a", "b"]);
    const subset = new Set(["a", "c"]);

    expect(isSubsetOf(superset, subset)).toBe(false);
  });

  it("should return false if superset is empty", () => {
    const superset = new Set([]);
    const subset = new Set(["a", "c"]);

    expect(isSubsetOf(superset, subset)).toBe(false);
  });
});
