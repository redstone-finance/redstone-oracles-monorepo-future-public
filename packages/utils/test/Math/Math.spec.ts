import {
  calculateAverageValue,
  calculateDeviationPercent,
  calculateSum,
  createSafeNumber,
  getMedian,
  NumberArg,
} from "../../src/ISafeNumber";
import { filterOutliers } from "../../src/math";

describe("calculateSum", () => {
  it("Should properly calculate sum for empty array", () => {
    expect(calculateSum([]).toString()).toBe("0");
  });

  it("Should properly calculate sum for 1-elem array", () => {
    expect(calculateSum([createSafeNumber(42)]).toString()).toBe("42");
  });

  it("Should properly calculate sum for 3-elem array", () => {
    expect(calculateSum([42, 100, 1000].map(createSafeNumber)).toString()).toBe(
      "1142"
    );
  });

  it("Should properly calculate sum for a big array", () => {
    const bigArr = Array<NumberArg>(2000).fill(120000);
    expect(calculateSum(bigArr).toString()).toBe((120000 * 2000).toString());
  });
});

describe("calculateAverageValue", () => {
  it("Should properly calculate an average value for 1-elem arrays", () => {
    expect(calculateAverageValue([createSafeNumber(42)]).toString()).toBe("42");
    expect(calculateAverageValue([createSafeNumber(142)]).toString()).toBe(
      "142"
    );
    expect(calculateAverageValue([createSafeNumber(120)]).toString()).toBe(
      "120"
    );
  });

  it("Should properly calculate an average value for a 3-elem array", () => {
    expect(
      calculateAverageValue([42, 44, 43].map(createSafeNumber)).toString()
    ).toBe("43");
  });

  it("Should properly calculate an average value for a big array", () => {
    const bigArr = Array<NumberArg>(2000).fill(createSafeNumber(1121315));
    expect(calculateAverageValue(bigArr).toString()).toBe("1121315");
  });

  it("Should throw for an empty array", () => {
    expect(() => calculateAverageValue([])).toThrow(
      "Can not calculate an average value for an empty array"
    );
  });
});

describe("calculateDeviationPercent", () => {
  it("Should properly calculate zero deviation", () => {
    expect(
      calculateDeviationPercent({
        prevValue: createSafeNumber(10.5),
        currValue: createSafeNumber(10.5),
      }).toString()
    ).toBe("0");
  });

  it("Should properly calculate big deviations", () => {
    expect(
      calculateDeviationPercent({
        prevValue: createSafeNumber(1),
        currValue: createSafeNumber(10),
      }).toString()
    ).toBe("90");

    expect(
      calculateDeviationPercent({
        prevValue: createSafeNumber(10),
        currValue: createSafeNumber(1),
      }).toString()
    ).toBe("900");
  });

  it("Should properly calculate deviation with a negative value", () => {
    expect(
      calculateDeviationPercent({
        prevValue: createSafeNumber(-42),
        currValue: createSafeNumber(42),
      }).toString()
    ).toBe("200");
  });

  it("Should work with zero value", () => {
    expect(
      calculateDeviationPercent({
        prevValue: createSafeNumber(1),
        currValue: createSafeNumber(0),
      }).unsafeToNumber()
    ).toBeGreaterThan(2 ** 40); // some big number depends on implementation of N
  });

  it("Should properly calculate deviation for zero measured value and non-zero true value", () => {
    expect(
      calculateDeviationPercent({
        prevValue: createSafeNumber(0),
        currValue: createSafeNumber(1),
      }).toString()
    ).toBe("100");
  });
});

describe("getMedian", () => {
  it("should throw for empty array", () => {
    expect(() => getMedian([])).toThrow();
  });

  it("should properly calculate median for odd number of elements", () => {
    expect(
      getMedian([3, 7, 2, 6, 5, 4, 9].map(createSafeNumber)).toString()
    ).toEqual("5");
    expect(getMedian([-3, 0, 3].map(createSafeNumber)).toString()).toEqual("0");
    expect(getMedian([3, 0, -3].map(createSafeNumber)).toString()).toEqual("0");
    expect(
      getMedian([-7, -5, -11, -4, -8].map(createSafeNumber)).toString()
    ).toEqual("-7");
  });

  it("should properly calculate median for even number of elements", () => {
    expect(
      getMedian([3, 7, 2, 6, 5, 4].map(createSafeNumber)).toString()
    ).toEqual("4.5");
    expect(getMedian([-3, 0].map(createSafeNumber)).toString()).toEqual("-1.5");
    expect(getMedian([0, -3].map(createSafeNumber)).toString()).toEqual("-1.5");
    expect(
      getMedian([-7, -5, -4, -8].map(createSafeNumber)).toString()
    ).toEqual("-6");
  });
});

describe("filterOutliers function", () => {
  it("should return the single number as the representative group when only one number is provided", () => {
    const result = filterOutliers([5], 100);
    expect(result.representativeGroup).toEqual([5]);
    expect(result.outliers).toEqual([]);
  });

  it("should return both numbers as the representative group when two numbers are within maxDiscrepancy", () => {
    const result = filterOutliers([5, 95], 100);
    expect(result.representativeGroup).toEqual([5, 95]);
    expect(result.outliers).toEqual([]);
  });

  it("should return one of the numbers as an outlier when two numbers are outside maxDiscrepancy", () => {
    const result = filterOutliers([5, 150], 100);
    expect(result.representativeGroup).toEqual([5]);
    expect(result.outliers).toEqual([150]);
  });

  it("should group numbers correctly into multiple groups based on maxDiscrepancy", () => {
    const result = filterOutliers([5, 10, 15, 200, 210, 220, 500], 100);
    expect(result.representativeGroup).toEqual([5, 10, 15]);
    expect(result.outliers).toEqual([200, 210, 220, 500]);
  });

  it("should group numbers correctly into multiple groups based on maxDiscrepancy", () => {
    const result = filterOutliers([1, 2, 5, 10, 15, 200, 210, 220, 500], 100);
    expect(result.representativeGroup).toEqual([1, 2, 5, 10, 15]);
    expect(result.outliers).toEqual([200, 210, 220, 500]);
  });

  it("should group numbers correctly into multiple groups based on maxDiscrepancy", () => {
    const result = filterOutliers([100, 201, 301, 401], 100);
    expect(result.representativeGroup).toEqual([100]);
    expect(result.outliers).toEqual([201, 301, 401]);
  });

  it("should group all numbers into a single group if they are within maxDiscrepancy", () => {
    const result = filterOutliers([5, 10, 15, 95], 100);
    expect(result.representativeGroup).toEqual([5, 10, 15, 95]);
    expect(result.outliers).toEqual([]);
  });

  it("should treat all numbers as separate groups if they are all outside maxDiscrepancy of each other", () => {
    const result = filterOutliers([5, 150, 300, 460], 100);
    expect(result.representativeGroup).toEqual([5]);
  });

  it("should select the biggest possible group", () => {
    const result = filterOutliers([1, 2, 3, 100, 101, 102, 103, 104], 100);
    expect(result.representativeGroup).toEqual([100, 101, 102, 103, 104]);
  });
});
