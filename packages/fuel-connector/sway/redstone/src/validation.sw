library validation;

// 2621440000 + data_package_index
pub const TIMESTAMP_OUT_OF_RANGE = 0x9C40_0000;

const MAX_DATA_TIMESTAMP_DELAY_SECONDS = 900; // 15 * 60
const MAX_DATA_TIMESTAMP_AHEAD_SECONDS = 180; // 3 * 60
pub fn validate_timestamp(i: u64, timestamp: u64, block_timestamp: u64) {
    if (block_timestamp > timestamp) {
        if (block_timestamp - timestamp > MAX_DATA_TIMESTAMP_DELAY_SECONDS)
        {
            log(timestamp);
            log(block_timestamp);
            revert(TIMESTAMP_OUT_OF_RANGE + i + 1000);
        }
    }

    if (timestamp > block_timestamp) {
        if (timestamp - block_timestamp > MAX_DATA_TIMESTAMP_AHEAD_SECONDS)
        {
            log(timestamp);
            log(block_timestamp);
            revert(TIMESTAMP_OUT_OF_RANGE + i + 2000);
        }
    }
}

const BASE_TS = 168000000;

#[test]
fn test_validate_proper_timestamps() {
    let mut i = 0;

    while (i < 2) {
        validate_timestamp(10, BASE_TS - MAX_DATA_TIMESTAMP_DELAY_SECONDS + i, BASE_TS);
        validate_timestamp(10, BASE_TS + MAX_DATA_TIMESTAMP_AHEAD_SECONDS - i, BASE_TS);

        i += 1;
    }
}

#[test(should_revert)]
fn test_validate_wrong_future_timestamp() {
    validate_timestamp(10, BASE_TS + MAX_DATA_TIMESTAMP_AHEAD_SECONDS + 1, BASE_TS);
}

#[test(should_revert)]
fn test_validate_wrong_past_timestamp() {
    validate_timestamp(10, BASE_TS - MAX_DATA_TIMESTAMP_DELAY_SECONDS - 1, BASE_TS);
}
