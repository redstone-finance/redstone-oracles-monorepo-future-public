import { calculateHistoricalPackagesTimestamp } from "../src";

const FULL_MINUTE_TS = 1710407460000;
const ONE_MINUTE_MS = 60000;

describe("Historical packages timestamp", () => {
  it(`Should properly return (x-1):30 for x:30 with 10s denominator`, () => {
    const result = calculateHistoricalPackagesTimestamp(
      ONE_MINUTE_MS,
      FULL_MINUTE_TS + 30 * 1000
    );

    expect(result).toEqual(FULL_MINUTE_TS - 30 * 1000);
  });

  it(`Should properly return (x-1):40 for x:40.001 with 10s denominator`, () => {
    const result = calculateHistoricalPackagesTimestamp(
      ONE_MINUTE_MS,
      FULL_MINUTE_TS + 40 * 1000 + 1
    );

    expect(result).toEqual(FULL_MINUTE_TS - 20 * 1000);
  });

  it(`Should properly return (x-1):30 for x:39.999 with 10s denominator`, () => {
    const result = calculateHistoricalPackagesTimestamp(
      ONE_MINUTE_MS,
      FULL_MINUTE_TS + 40 * 1000 - 1
    );

    expect(result).toEqual(FULL_MINUTE_TS - 30 * 1000);
  });

  it(`Should properly return (x-1):00 for x:40 with one minute denominator`, () => {
    const result = calculateHistoricalPackagesTimestamp(
      ONE_MINUTE_MS,
      FULL_MINUTE_TS + 40 * 1000,
      ONE_MINUTE_MS
    );

    expect(result).toEqual(FULL_MINUTE_TS - ONE_MINUTE_MS);
  });

  it(`Should properly return (x-1):00 for x:30 with one minute denominator`, () => {
    const result = calculateHistoricalPackagesTimestamp(
      ONE_MINUTE_MS,
      FULL_MINUTE_TS + 30 * 1000,
      ONE_MINUTE_MS
    );

    expect(result).toEqual(FULL_MINUTE_TS - ONE_MINUTE_MS);
  });

  it(`Should properly return (x-1):00 for x:20 with one minute denominator`, () => {
    const result = calculateHistoricalPackagesTimestamp(
      ONE_MINUTE_MS,
      FULL_MINUTE_TS + 20 * 1000,
      ONE_MINUTE_MS
    );

    expect(result).toEqual(FULL_MINUTE_TS - ONE_MINUTE_MS);
  });

  it(`Should properly return (x-1):00 for x:00 with one minute denominator`, () => {
    const result = calculateHistoricalPackagesTimestamp(
      ONE_MINUTE_MS,
      FULL_MINUTE_TS,
      ONE_MINUTE_MS
    );

    expect(result).toEqual(FULL_MINUTE_TS - ONE_MINUTE_MS);
  });

  it(`Should properly return (x-1):00 for x:30 and offset 1.5 with one minute denominator`, () => {
    const result = calculateHistoricalPackagesTimestamp(
      1.5 * ONE_MINUTE_MS,
      FULL_MINUTE_TS + 30 * 1000,
      ONE_MINUTE_MS
    );

    expect(result).toEqual(FULL_MINUTE_TS - ONE_MINUTE_MS);
  });

  it(`Should properly return (x-2):00 for x:20 and offset 1.5 with one minute denominator`, () => {
    const result = calculateHistoricalPackagesTimestamp(
      1.5 * ONE_MINUTE_MS,
      FULL_MINUTE_TS + 20 * 1000,
      ONE_MINUTE_MS
    );

    expect(result).toEqual(FULL_MINUTE_TS - 2 * ONE_MINUTE_MS);
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
