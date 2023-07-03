import {
  calculateAverageValue,
  calculateDeviationPercent,
  calculateSum,
  createSafeNumber,
  getMedian,
} from "../../src/ISafeNumber";

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
    const bigArr = Array(2000).fill(120000);
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
    const bigArr = Array(2000).fill(createSafeNumber(1121315));
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
