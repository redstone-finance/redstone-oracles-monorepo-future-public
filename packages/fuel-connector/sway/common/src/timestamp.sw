library;

use std::block::timestamp;

const TAI64_UNIX_ADJUSTMENT = (10 + (1 << 62));

pub fn get_unix_timestamp() -> u64 {
    timestamp() - TAI64_UNIX_ADJUSTMENT
}
