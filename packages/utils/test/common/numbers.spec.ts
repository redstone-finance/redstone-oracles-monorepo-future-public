import { safelyConvertAnyValueToNumber } from "../../src/common/numbers";

describe("utils/numbers", () => {
  describe("safelyConvertAnyValueToNumber", () => {
    // eslint-disable-next-line @typescript-eslint/no-loss-of-precision
    const numbersToCheck = [42, 4212312, 0, -1, 12342.323423123221];

    it("Should properly convert strings to numbers", () => {
      for (const num of numbersToCheck) {
        const convertedNum = safelyConvertAnyValueToNumber(String(num));
        expect(convertedNum).toBe(num);
      }
    });

    it("Should properly convert numbers to numbers", () => {
      for (const num of numbersToCheck) {
        const convertedNum = safelyConvertAnyValueToNumber(num);
        expect(convertedNum).toBe(num);
      }
    });

    it("Should return NaN for not string or valid numbers", () => {
      const nanValues = [
        NaN,
        null,
        undefined,
        false,
        true,
        {},
        { haha: 12 },
        [3, 2, 4],
      ];
      for (const nanValue of nanValues) {
        expect(safelyConvertAnyValueToNumber(nanValue)).toBe(NaN);
      }
    });
  });
});
