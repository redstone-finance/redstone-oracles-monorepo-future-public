import {
  calculateAverageValue,
  calculateDeviationPercent,
  calculateSum,
  createSafeNumber,
  getMedian,
  getWeightedMedian,
  logarithmicWeighting,
  NumberArg,
} from "../../src/ISafeNumber";
import { filterOutliers } from "../../src/math";
import { monotoneCubicInterpolation } from "../../src/math/monotonic-cubic-spline";

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
        baseValue: createSafeNumber(10.5),
        deviatedValue: createSafeNumber(10.5),
      }).toString()
    ).toBe("0");
  });

  it("Should properly calculate big deviations", () => {
    expect(
      calculateDeviationPercent({
        baseValue: createSafeNumber(1),
        deviatedValue: createSafeNumber(10),
      }).toString()
    ).toBe("900");

    expect(
      calculateDeviationPercent({
        baseValue: createSafeNumber(10),
        deviatedValue: createSafeNumber(1),
      }).toString()
    ).toBe("90");
  });

  it("Should properly calculate deviation with a negative value", () => {
    expect(
      calculateDeviationPercent({
        baseValue: createSafeNumber(-42),
        deviatedValue: createSafeNumber(42),
      }).toString()
    ).toBe("200");
  });

  it("Should work with zero value", () => {
    expect(
      calculateDeviationPercent({
        baseValue: createSafeNumber(0),
        deviatedValue: createSafeNumber(1),
      }).unsafeToNumber()
    ).toBeGreaterThan(2 ** 40); // some big number depends on implementation of N
  });

  it("Should properly calculate deviation for zero measured value and non-zero true value", () => {
    expect(
      calculateDeviationPercent({
        baseValue: createSafeNumber(1),
        deviatedValue: createSafeNumber(0),
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

describe("getWeightedMedian", () => {
  it("should throw for empty array", () => {
    expect(() => getWeightedMedian([])).toThrow();
  });

  it("should properly calculate weighted median", () => {
    expect(
      getWeightedMedian([
        { value: createSafeNumber(5), weight: createSafeNumber(0.25) },
        { value: createSafeNumber(4), weight: createSafeNumber(0.3) },
        { value: createSafeNumber(3), weight: createSafeNumber(0.2) },
        { value: createSafeNumber(2), weight: createSafeNumber(0.1) },
        { value: createSafeNumber(1), weight: createSafeNumber(0.15) },
      ]).toString()
    ).toEqual("4");
    expect(
      getWeightedMedian([
        { value: createSafeNumber(1), weight: createSafeNumber(0.25) },
        { value: createSafeNumber(2), weight: createSafeNumber(0.25) },
        { value: createSafeNumber(3), weight: createSafeNumber(0.25) },
        { value: createSafeNumber(4), weight: createSafeNumber(0.25) },
      ]).toString()
    ).toEqual("2.5");
  });
});

describe("logarithmicWeighting", () => {
  it("should throw for empty array", () => {
    expect(() => logarithmicWeighting([])).toThrow();
  });

  it("should return 1 for a singleton array", () => {
    expect(
      logarithmicWeighting([
        {
          value: createSafeNumber(1.2),
          weight: createSafeNumber(3.4),
        },
      ])
    ).toEqual([
      {
        value: createSafeNumber(1.2),
        weight: createSafeNumber(1),
      },
    ]);
  });

  it("should logarithmically reduce the weight proportions", () => {
    expect(
      logarithmicWeighting([
        {
          value: createSafeNumber(1),
          weight: createSafeNumber(4),
        },
        {
          value: createSafeNumber(2),
          weight: createSafeNumber(4),
        },
        {
          value: createSafeNumber(2),
          weight: createSafeNumber(4),
        },
        {
          value: createSafeNumber(3),
          weight: createSafeNumber(12),
        },
        {
          value: createSafeNumber(3),
          weight: createSafeNumber(4092),
        },
      ])
    ).toEqual([
      {
        value: createSafeNumber(1),
        weight: createSafeNumber(1),
      },
      {
        value: createSafeNumber(2),
        weight: createSafeNumber(1),
      },
      {
        value: createSafeNumber(2),
        weight: createSafeNumber(1),
      },
      {
        value: createSafeNumber(3),
        weight: createSafeNumber(2),
      },
      {
        value: createSafeNumber(3),
        weight: createSafeNumber(10),
      },
    ]);
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

describe("monotonic cubic interpolation", () => {
  it("should throw for different lengths", () => {
    expect(() => monotoneCubicInterpolation([1, 2], [3])).toThrow();
  });

  it("should throw for empty arrays", () => {
    expect(() => monotoneCubicInterpolation([], [])).toThrow();
  });

  it("should throw for one point", () => {
    expect(() => monotoneCubicInterpolation([0], [0])).toThrow();
  });

  it("should throw for not monotonic", () => {
    expect(() => monotoneCubicInterpolation([1, 2, 3], [12, 18, 15])).toThrow();
    expect(() => monotoneCubicInterpolation([1, 2, 3], [5, 3, 4])).toThrow();
  });

  it("should match the given points", () => {
    const xs = [1, 2, 3];
    const ys = [10, 100, 1000];
    const precision = 0.01;
    const interpolation = monotoneCubicInterpolation(xs, ys);

    expect(interpolation.forX(xs[0])).toEqual(ys[0]);
    expect(interpolation.forX(xs[1])).toEqual(ys[1]);
    expect(interpolation.forX(xs[2])).toEqual(ys[2]);
    expect(Math.abs(interpolation.forY(ys[0], precision) - xs[0])).toBeLessThan(
      precision
    );
    expect(Math.abs(interpolation.forY(ys[1], precision) - xs[1])).toBeLessThan(
      precision
    );
    expect(Math.abs(interpolation.forY(ys[2], precision) - xs[2])).toBeLessThan(
      precision
    );
  });

  it("should be monotonic", () => {
    const xs = [0, 1, 2];
    const ys = [0, 1000, 1001];
    const precision = 0.01;
    const half = 0.5;
    const interpolation = monotoneCubicInterpolation(xs, ys);

    expect(interpolation.forX(xs[0] - half)).toBeLessThan(ys[0]);
    expect(interpolation.forX(xs[0] + half)).toBeGreaterThan(ys[0]);
    expect(interpolation.forX(xs[0] + half)).toBeLessThan(ys[1]);
    expect(interpolation.forX(xs[1] + half)).toBeGreaterThan(ys[1]);
    expect(interpolation.forX(xs[1] + half)).toBeLessThan(ys[2]);
    expect(interpolation.forX(xs[2] + half)).toBeGreaterThan(ys[2]);

    expect(interpolation.forY(ys[0] - half, precision)).toBeLessThan(xs[0]);
    expect(interpolation.forY(ys[0] + half, precision)).toBeGreaterThan(xs[0]);
    expect(interpolation.forY(ys[0] + half, precision)).toBeLessThan(xs[1]);
    expect(interpolation.forY(ys[1] + half, precision)).toBeGreaterThan(xs[1]);
    expect(interpolation.forY(ys[1] + half, precision)).toBeLessThan(xs[2]);
    expect(interpolation.forY(ys[2] + half, precision)).toBeGreaterThan(xs[2]);
  });

  it("should fit a line to linear points", () => {
    const xs = [1, 2, 4, 5];
    const ys = [1, 2, 4, 5];
    const precision = 0.01;
    const interpolation = monotoneCubicInterpolation(xs, ys);

    expect(interpolation.forX(3)).toEqual(3);
    expect(Math.abs(interpolation.forY(3, precision) - 3)).toBeLessThan(
      precision
    );
  });
});
