import { calculateHistoricalPackagesTimestamp } from "../src";

const FULL_MINUTE_TS = 1710407460000;

describe("Historical packages timestamp", () => {
  it(`Should properly return (x-1):00 for x:40`, () => {
    const result = calculateHistoricalPackagesTimestamp(
      1,
      FULL_MINUTE_TS + 40 * 1000
    );

    expect(result).toEqual(FULL_MINUTE_TS - 60 * 1000);
  });

  it(`Should properly return (x-1):00 for x:30`, () => {
    const result = calculateHistoricalPackagesTimestamp(
      1,
      FULL_MINUTE_TS + 30 * 1000
    );

    expect(result).toEqual(FULL_MINUTE_TS - 60 * 1000);
  });

  it(`Should properly return (x-1):00 for x:20`, () => {
    const result = calculateHistoricalPackagesTimestamp(
      1,
      FULL_MINUTE_TS + 20 * 1000
    );

    expect(result).toEqual(FULL_MINUTE_TS - 60 * 1000);
  });

  it(`Should properly return (x-1):00 for x:00`, () => {
    const result = calculateHistoricalPackagesTimestamp(1, FULL_MINUTE_TS);

    expect(result).toEqual(FULL_MINUTE_TS - 60 * 1000);
  });

  it(`Should properly return (x-1):00 for x:30 and offset 1.5`, () => {
    const result = calculateHistoricalPackagesTimestamp(
      1.5,
      FULL_MINUTE_TS + 30 * 1000
    );

    expect(result).toEqual(FULL_MINUTE_TS - 60 * 1000);
  });

  it(`Should properly return (x-2):00 for x:20 and offset 1.5`, () => {
    const result = calculateHistoricalPackagesTimestamp(
      1.5,
      FULL_MINUTE_TS + 20 * 1000
    );

    expect(result).toEqual(FULL_MINUTE_TS - 2 * 60 * 1000);
  });

  it(`Should properly return undefined for 0 offset`, () => {
    const result = calculateHistoricalPackagesTimestamp(0, FULL_MINUTE_TS);

    expect(result).toEqual(undefined);
  });

  it(`Should properly return undefined for negative offset`, () => {
    const result = calculateHistoricalPackagesTimestamp(-1);

    expect(result).toEqual(undefined);
  });
});
