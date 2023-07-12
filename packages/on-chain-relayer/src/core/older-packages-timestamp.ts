const MILLISECONDS_IN_ONE_MINUTE = 60 * 1000;

export const olderPackagesTimestamp = (
  deviationCheckOffsetInMinutes: number
) => {
  if (deviationCheckOffsetInMinutes > 0) {
    // We round the timestamp to full minutes for being compatible with
    // oracle-nodes, which usually work with rounded 10s and 60s intervals
    const roundedTimestampWithOffset =
      Math.round(
        Date.now() / MILLISECONDS_IN_ONE_MINUTE - deviationCheckOffsetInMinutes
      ) * MILLISECONDS_IN_ONE_MINUTE;

    return roundedTimestampWithOffset;
  }
};
