// Abbreviations:
// * BS = Byte size

// Number of bytes reserved to store timestamp
export const TIMESTAMP_BS = 6;

// Number of bytes reserved to store the number of data points
export const DATA_POINTS_COUNT_BS = 3;

// Number of bytes reserved to store datapoints byte size
export const DATA_POINT_VALUE_BYTE_SIZE_BS = 4;

// Maximum numeric value byte size
export const MAX_NUM_VALUE_BS = 32;

// Default value byte size for numeric values
export const DEFAULT_NUM_VALUE_BS = 32;

// Default precision for numeric values
export const DEFAULT_NUM_VALUE_DECIMALS = 8;

// Number of bytes reserved for data packages count
export const DATA_PACKAGES_COUNT_BS = 2;

// Number of bytes reserved for unsigned metadata byte size
export const UNSIGNED_METADATA_BYTE_SIZE_BS = 3;

// RedStone marker, which will be appended in the end of each transaction
export const REDSTONE_MARKER_HEX = "0x000002ed57011e0000";

// Byte size of RedStone marker
// we subtract 1 because of the 0x prefix
export const REDSTONE_MARKER_BS = REDSTONE_MARKER_HEX.length / 2 - 1;

// Byte size of signatures
export const SIGNATURE_BS = 65;

// Byte size of data feed id
export const DATA_FEED_ID_BS = 32;

// Key for big data package
export const ALL_FEEDS_KEY = "___ALL_FEEDS___";
