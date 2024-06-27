import { NumericDataPoint } from "../src";

describe("Numeric data point", () => {
  test("Should throw an error for numeric data point with too large value size", () => {
    expect(
      () =>
        new NumericDataPoint({
          dataFeedId: "BTC",
          value: 42000,
          valueByteSize: 33,
        })
    ).toThrow(
      "Assertion failed: The byte size of the numeric value cannot be greater than 32"
    );
  });
});
