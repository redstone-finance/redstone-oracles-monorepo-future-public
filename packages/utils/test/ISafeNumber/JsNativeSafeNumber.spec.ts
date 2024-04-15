import {
  JsNativeSafeNumber,
  JsNativeSafeNumberConfig,
  NumberArg,
} from "../../src/ISafeNumber";

describe("JsNativePreciseNumber", () => {
  describe("from", () => {
    it.each([
      ["0", 0],
      ["1", 1],
      ["123.123", 123.123],
      [0, 0],
      [-0, -0],
      ["-123.123", -123.123],
      ["-12", -12],
      [1, 1],
      [123.123, 123.123],
      ["0.", /Invalid number format/],
      ["0.1.2", /Invalid number format/],
      [".1", 0.1],
      ["1,1", /Invalid number format/],
      ["1e1", 10],
      ["1E+2", 100],
      ["00000000000000000000000000000000000000000000000001", 1],
      ["0000000000000000000000000000000000000000000000000.1", 0.1],
      [`${"0".repeat(100)}.1`, 0.1],
      [Number(), 0],
      [undefined as unknown as NumberArg, /Invalid number format/],
      [null as unknown as NumberArg, /Invalid number format/],
      [NaN, /Invalid number format/],
      [Infinity, /Invalid number format/],
      [+Infinity, /Invalid number format/],
      [-Infinity, /Invalid number format/],
      [JsNativeSafeNumberConfig.MIN_NUMBER / 10000, /Invalid number format/],
      [
        JsNativeSafeNumberConfig.MIN_NUMBER * -1,
        -JsNativeSafeNumberConfig.MIN_NUMBER,
      ],
      [
        JsNativeSafeNumberConfig.MIN_NUMBER,
        JsNativeSafeNumberConfig.MIN_NUMBER,
      ],
      [
        JsNativeSafeNumberConfig.MAX_NUMBER + 1,
        /Number is bigger than max number acceptable by REDSTONE/,
      ],
      // 8 decimals number
      ["1.12345678", 1.12345678],
      // 13 decimals number
      ["1.1234567812345", 1.1234567812345],
      // 14 decimals number
      ["1.12345678123456", 1.12345678123456],
      // 15 decimals number
      ["1.123456781234567", 1.12345678123456],
      // 32 decimals number
      ["1.12345678123456781234567812345678", 1.12345678123456],
      // 64 decimals number
      [
        "1.1234567812345678123456781234567812345678123456781234567812345678",
        /Invalid number format/,
      ],
      ["1e+5", 100000],
      ["1e-5", 0.00001],
      ["1E+5", 100000],
      ["1E-5", 0.00001],
      ["1e5", 100000],
      [JsNativeSafeNumberConfig.MIN_NUMBER / 2, /Invalid number format/],
      [JsNativeSafeNumberConfig.MIN_NUMBER / 2, /Invalid number format/],
      [JsNativeSafeNumberConfig.MIN_NUMBER * -0.5, /Invalid number format/],
      ["0x01", /Invalid number format/],
    ])(
      "parse to JsNativePreciseNumber %s to %s",
      (value: NumberArg, expected: number | RegExp) => {
        if (typeof expected === "number") {
          expect(JsNativeSafeNumber.from(value).eq(expected)).toBe(true);
        } else {
          expect(() => JsNativeSafeNumber.from(value)).toThrowError(expected);
        }
      }
    );
  });

  it("assert positive", () => {
    expect(() => JsNativeSafeNumber.from(-10).assertPositive()).toThrowError(
      /Assert non positive failed/
    );

    expect(() => JsNativeSafeNumber.from(0).assertPositive()).toThrowError(
      /Assert non positive failed/
    );

    expect(() => JsNativeSafeNumber.from(-0).assertPositive()).toThrowError(
      /Assert non positive failed/
    );

    expect(() => JsNativeSafeNumber.from(10).assertPositive()).not.toThrow();
  });

  describe("arithmetic operations", () => {
    describe("add", () => {
      it("should add floats (tricky 0.3)", () => {
        const result = JsNativeSafeNumber.from("100.131").add("100.123");
        expect(result.toString()).toBe("200.25400000000002"); // with this implementation we we
      });
      it("should add floats", () => {
        const result = JsNativeSafeNumber.from("120.132").add("0.122");
        expect(result.toString()).toBe("120.254");
      });
      it("should add  value < 0", () => {
        const result = JsNativeSafeNumber.from("120.132").add("-120");
        expect(result.eq("0.132")).toBe(true);
      });
      it("should add  two integers", () => {
        const result = JsNativeSafeNumber.from("120").add("-120");
        expect(result.toString()).toBe("0");
      });
      it("should add big integers", () => {
        const result = JsNativeSafeNumber.from(
          JsNativeSafeNumberConfig.MAX_NUMBER / 2
        ).add(JsNativeSafeNumberConfig.MAX_NUMBER / 2);
        expect(result.toString()).toBe(
          JsNativeSafeNumberConfig.MAX_NUMBER.toString()
        );
      });
      it("should throw on overflow", () => {
        expect(() =>
          JsNativeSafeNumber.from(JsNativeSafeNumberConfig.MAX_NUMBER / 2).add(
            JsNativeSafeNumberConfig.MAX_NUMBER / 2 + 1
          )
        ).toThrowError();
      });
    });

    describe("sub", () => {
      it("should sub floats (tricky 0.3)", () => {
        const result = JsNativeSafeNumber.from("120.132").sub("0.123");
        expect(result.toString()).toBe("120.009");
      });
      it("should sub floats", () => {
        const result = JsNativeSafeNumber.from("120.132").sub("0.122");
        expect(result.toString()).toBe("120.01");
      });
      it("should sub value < 0", () => {
        const result = JsNativeSafeNumber.from("120.132").sub("-120");
        expect(result.toString()).toBe("240.132");
      });
      it("should sub two integers", () => {
        const result = JsNativeSafeNumber.from(`120.${"3".repeat(14)}`).sub(
          `120.${"3".repeat(14)}`
        );
        expect(result.toString()).toBe("0");
      });
      it("should sub big integers", () => {
        const result = JsNativeSafeNumber.from(
          JsNativeSafeNumberConfig.MAX_NUMBER / 2
        ).sub(JsNativeSafeNumberConfig.MAX_NUMBER / 2);
        expect(result.toString()).toBe("0");
      });
      it("should throw on overflow", () => {
        expect(() =>
          JsNativeSafeNumber.from(-JsNativeSafeNumberConfig.MAX_NUMBER / 2).sub(
            JsNativeSafeNumberConfig.MAX_NUMBER
          )
        ).toThrowError();
      });
    });

    describe("mul", () => {
      it("should work for integers", () => {
        const result = JsNativeSafeNumber.from(10).mul(100);
        expect(result.toString()).toBe("1000");
      });

      it("should fail on overflow", () => {
        expect(() =>
          JsNativeSafeNumber.from(1.1).mul(JsNativeSafeNumberConfig.MAX_NUMBER)
        ).toThrowError();
      });

      it("should fail on underflow", () => {
        expect(() =>
          JsNativeSafeNumber.from(0.99).mul(JsNativeSafeNumberConfig.MIN_NUMBER)
        ).toThrowError();
      });

      it("should work big numbers", () => {
        expect(
          JsNativeSafeNumber.from(11)
            .mul(JsNativeSafeNumberConfig.MIN_NUMBER)
            .toString()
        ).toBe("1.1e-13");
      });
    });
    describe("div", () => {
      it("should work for integers", () => {
        const result = JsNativeSafeNumber.from(10).div(100);
        expect(result.toString()).toBe("0.1");
      });

      it("should fail on overflow", () => {
        expect(() =>
          JsNativeSafeNumber.from(1.1).div(JsNativeSafeNumberConfig.MAX_NUMBER)
        ).toThrowError();
      });

      it("should fail on underflow", () => {
        expect(() =>
          JsNativeSafeNumber.from(JsNativeSafeNumberConfig.MIN_NUMBER).div(
            1.00001
          )
        ).toThrowError();
      });

      it("should work big numbers", () => {
        expect(
          JsNativeSafeNumber.from(1.1)
            .div(JsNativeSafeNumberConfig.MIN_NUMBER)
            .toString()
        ).toBe("110000000000000.02");
      });
    });
    describe("abs", () => {
      it("should work for zero", () => {
        const result = JsNativeSafeNumber.from(0).abs();
        expect(result.toString()).toBe("0");
      });

      it("should work for big negative integers", () => {
        const result = JsNativeSafeNumber.from(
          -JsNativeSafeNumberConfig.MAX_NUMBER
        ).abs();
        expect(result.toString()).toBe(
          JsNativeSafeNumberConfig.MAX_NUMBER.toString()
        );
      });
      it("should work for big positive integers", () => {
        const result = JsNativeSafeNumber.from(
          JsNativeSafeNumberConfig.MAX_NUMBER
        ).abs();
        expect(result.toString()).toBe(
          JsNativeSafeNumberConfig.MAX_NUMBER.toString()
        );
      });
      it("should work for small negative numbers", () => {
        const result = JsNativeSafeNumber.from(
          -JsNativeSafeNumberConfig.MIN_NUMBER
        ).abs();
        expect(result.toString()).toBe(
          JsNativeSafeNumberConfig.MIN_NUMBER.toString()
        );
      });
      it("should work for small positive numbers", () => {
        const result = JsNativeSafeNumber.from(
          JsNativeSafeNumberConfig.MIN_NUMBER
        ).abs();
        expect(result.toString()).toBe(
          JsNativeSafeNumberConfig.MIN_NUMBER.toString()
        );
      });
    });
    describe("log2", () => {
      it("should throw for zero", () => {
        expect(() => JsNativeSafeNumber.from(0).log2()).toThrowError();
      });
      it("should work for one", () => {
        const result = JsNativeSafeNumber.from(1).log2();
        expect(result.toString()).toBe("0");
      });
      it("should work for big integers", () => {
        const result = JsNativeSafeNumber.from(
          JsNativeSafeNumberConfig.MAX_NUMBER
        ).log2();
        expect(result.toString()).toBe("53");
      });
      it("should work for small numbers", () => {
        const result = JsNativeSafeNumber.from(2 ** -46).log2();
        expect(result.toString()).toBe("-46");
      });
    });
    describe("mod", () => {
      it("should work for zero", () => {
        const result = JsNativeSafeNumber.from(0).mod(123);
        expect(result.toString()).toBe("0");
      });
      it("should work for remainder", () => {
        const result = JsNativeSafeNumber.from(100).mod(123);
        expect(result.toString()).toBe("100");
      });
      it("should work for same numbers", () => {
        const result = JsNativeSafeNumber.from(123).mod(123);
        expect(result.toString()).toBe("0");
      });
      it("should work for multiple", () => {
        const result = JsNativeSafeNumber.from(123 * 123).mod(123);
        expect(result.toString()).toBe("0");
      });
      it("should work for big numbers", () => {
        const result = JsNativeSafeNumber.from(
          JsNativeSafeNumberConfig.MIN_NUMBER
        ).mod(JsNativeSafeNumberConfig.MAX_NUMBER);
        expect(result.toString()).toBe(
          JsNativeSafeNumberConfig.MIN_NUMBER.toString()
        );
      });
      it("should fail on underflow", () => {
        expect(() =>
          JsNativeSafeNumber.from(1).mod(JsNativeSafeNumberConfig.MIN_NUMBER)
        ).toThrowError();
      });
    });
    describe("round", () => {
      it("should work for small integers", () => {
        let result = JsNativeSafeNumber.from(0).round();
        expect(result.toString()).toBe("0");

        result = JsNativeSafeNumber.from(1).round();
        expect(result.toString()).toBe("1");
      });
      it("should work for big integers", () => {
        const result0 = JsNativeSafeNumber.from(
          JsNativeSafeNumberConfig.MAX_NUMBER
        ).round();
        expect(result0.toString()).toBe(
          JsNativeSafeNumberConfig.MAX_NUMBER.toString()
        );
      });
      it("should work for fractions", () => {
        let result = JsNativeSafeNumber.from(0.3).round();
        expect(result.toString()).toBe("0");
        result = JsNativeSafeNumber.from(0.5).round();
        expect(result.toString()).toBe("1");
        result = JsNativeSafeNumber.from(0.9).round();
        expect(result.toString()).toBe("1");
      });
      it("should work for negative fractions", () => {
        let result = JsNativeSafeNumber.from(-0.3).round();
        expect(result.toString()).toBe("0");
        result = JsNativeSafeNumber.from(-0.5).round();
        expect(result.toString()).toBe("0");
        result = JsNativeSafeNumber.from(-0.9).round();
        expect(result.toString()).toBe("-1");
      });
      it("should work for small numbers", () => {
        const result = JsNativeSafeNumber.from(
          JsNativeSafeNumberConfig.MIN_NUMBER
        ).round();
        expect(result.toString()).toBe("0");
      });
    });
  });
});
