import { calculateHistoricalPackagesTimestamp } from "../src";

const FULL_MINUTE_TS = 1710407460000;

describe("Historical packages timestamp", () => {
  it(`Should properly return (x-1):50 for x:50 and offset 1 min`, () => {
    const result = calculateHistoricalPackagesTimestamp(
      60_000,
      FULL_MINUTE_TS + 50 * 1000
    );

    expect(result).toEqual(FULL_MINUTE_TS - 10 * 1000);
  });

  it(`Should properly return (x-1):00 for x:00 and offset 1 min`, () => {
    const result = calculateHistoricalPackagesTimestamp(60_000, FULL_MINUTE_TS);

    expect(result).toEqual(FULL_MINUTE_TS - 60 * 1000);
  });

  it(`Should properly return (x-1):00 for x:01 and offset 1 min`, () => {
    const result = calculateHistoricalPackagesTimestamp(
      60_000,
      FULL_MINUTE_TS + 1 * 1000
    );

    expect(result).toEqual(FULL_MINUTE_TS - 60 * 1000);
  });

  it(`Should properly return (x-1):50 for x:59 and offset 1 min`, () => {
    const result = calculateHistoricalPackagesTimestamp(
      60_000,
      FULL_MINUTE_TS + 59 * 1000
    );

    expect(result).toEqual(FULL_MINUTE_TS - 10 * 1000);
  });

  it(`Should properly return (x-1):40 for x:00 and offset 12s`, () => {
    const result = calculateHistoricalPackagesTimestamp(12_000, FULL_MINUTE_TS);

    expect(result).toEqual(FULL_MINUTE_TS - 20 * 1000);
  });

  it(`Should properly return x:50 for x:59 and offset 3s`, () => {
    const result = calculateHistoricalPackagesTimestamp(
      3_000,
      FULL_MINUTE_TS + 59 * 1000
    );

    expect(result).toEqual(FULL_MINUTE_TS + 50 * 1000);
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
