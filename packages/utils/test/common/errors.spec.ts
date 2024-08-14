import { assertThenReturnOrFail } from "../../src/common";

describe("assertThenReturnOrFail", () => {
  it("should return the value when there are no errors", () => {
    const value = "test value";
    const result = assertThenReturnOrFail(
      value,
      [],
      "Test error message",
      true
    );
    expect(result).toBe(value);
  });

  it("should throw an AggregateError when there are errors and failOnError is true", () => {
    const errors = [new Error("First error"), new Error("Second error")];
    const errMsg = "Aggregate error message";

    expect(() => {
      assertThenReturnOrFail("test value", errors, errMsg, true);
    }).toThrow(AggregateError);

    try {
      assertThenReturnOrFail("test value", errors, errMsg, true);
    } catch (error) {
      expect(error).toBeInstanceOf(AggregateError);
      expect((error as AggregateError).message).toBe(errMsg);
      expect((error as AggregateError).errors).toEqual(errors);
    }
  });

  it("should return the value when there are errors and failOnError is false", () => {
    const errors = [new Error("First error")];
    const errMsg = "Aggregate error message";

    const result = assertThenReturnOrFail("test value", errors, errMsg, false);

    expect(result).toBe("test value");
  });
});
