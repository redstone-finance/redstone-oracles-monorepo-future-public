// Abbreviations:
// * BS = Byte size

// Number of bytes reserved to store timestamp
export const TIMESTAMP_BS = 6;

// Number of bytes reserved to store the number of data points
export const DATA_POINTS_COUNT_BS = 3;

// Number of bytes reserved to store datapoints byte size
export const DATA_POINT_VALUE_BYTE_SIZE_BS = 4;

// Default value byte size for numeric values
export const DEFAULT_NUM_VALUE_BS = 32;

// Default precision for numeric values
export const DEFAULT_NUM_VALUE_DECIMALS = 8;

// Number of bytes reserved for data packages count
export const DATA_PACKAGES_COUNT_BS = 2;

// Number of bytes reserved for unsigned metadata byte size
export const UNSGINED_METADATA_BYTE_SIZE_BS = 3;

// RedStone marker that will be appended to the end of each transaction
// Represented as hex string
export const REDSTONE_MARKER_HEX = "0x0000ff0000";

// Byte size of the RedStone marker
export const REDSTONE_MARKER_BS = REDSTONE_MARKER_HEX.length / 2;
