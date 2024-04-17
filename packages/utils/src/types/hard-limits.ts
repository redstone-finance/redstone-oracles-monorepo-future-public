export const LAST_UPDATED_TIMESTAMP_SYMBOL = "__lastUpdatedTimestamp";

type TimestampInHardLimits = {
  [LAST_UPDATED_TIMESTAMP_SYMBOL]: number;
};

export interface HardLimitsForSymbol {
  lower: number;
  upper: number;
}

export type HardLimits = Partial<Record<string, HardLimitsForSymbol>>;

export type HardLimitsWithTimestamp = HardLimits &
  Partial<TimestampInHardLimits>;
