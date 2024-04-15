export interface ISafeNumber {
  add(numberLike: NumberArg): ISafeNumber;
  sub(numberLike: NumberArg): ISafeNumber;
  div(numberLike: NumberArg): ISafeNumber;
  mul(numberLike: NumberArg): ISafeNumber;
  eq(numberLike: NumberArg): boolean;
  lt(numberLike: NumberArg): boolean;
  lte(numberLike: NumberArg): boolean;
  gt(numberLike: NumberArg): boolean;
  gte(numberLike: NumberArg): boolean;
  abs(): ISafeNumber;
  log2(): ISafeNumber;
  mod(divisor: NumberArg): ISafeNumber;
  round(): ISafeNumber;
  decimals(): number;
  assertNonNegative(): void;
  assertPositive(): void;
  /** Convert number to string without loosing precision */
  toString(): string;
  unsafeToNumber(): number;
  isSafeNumber(): boolean;
}

export type NumberArg = string | number | ISafeNumber;
