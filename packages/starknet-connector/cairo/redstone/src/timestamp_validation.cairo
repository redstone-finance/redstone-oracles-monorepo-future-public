use core::array::ArrayTrait;
use core::traits::Into;
use redstone::numbers::Felt252PartialOrd;

// 2621440000 + data_package_index + 1000/2000
const TIMESTAMP_OUT_OF_RANGE: felt252 = 0x9C400000;

const MAX_DATA_TIMESTAMP_DELAY_SECONDS: felt252 = 900; // 15 * 60
const MAX_DATA_TIMESTAMP_AHEAD_SECONDS: felt252 = 600; // 10 * 60 due to block time 5 min.

pub(crate) fn validate_timestamp(index: usize, timestamp: felt252, block_timestamp: u64) {
    let block_timestamp: felt252 = block_timestamp.into();

    if (block_timestamp > timestamp) {
        if (block_timestamp - timestamp > MAX_DATA_TIMESTAMP_DELAY_SECONDS) {
            panic_timestamp(:block_timestamp, :timestamp, :index, is_too_old: true);
        }
    }

    if (timestamp > block_timestamp) {
        if (timestamp - block_timestamp > MAX_DATA_TIMESTAMP_AHEAD_SECONDS) {
            panic_timestamp(:block_timestamp, :timestamp, :index, is_too_old: false);
        }
    }
}

fn panic_timestamp(block_timestamp: felt252, timestamp: felt252, index: usize, is_too_old: bool) {
    let mut arr: Array<felt252> = Default::default();
    let add = if is_too_old {
        1000
    } else {
        2000
    };

    arr.append(TIMESTAMP_OUT_OF_RANGE + index.into() + add);
    arr.append(timestamp);
    arr.append(block_timestamp);
    arr.append(index.into());

    panic(arr);
}

#[cfg(test)]
mod tests {
    use core::option::OptionTrait;
    use core::traits::TryInto;

    use super::MAX_DATA_TIMESTAMP_AHEAD_SECONDS;
    use super::MAX_DATA_TIMESTAMP_DELAY_SECONDS;
    use super::validate_timestamp;

    const BASE_TS: felt252 = 168000000;

    #[test]
    fn test_validate_proper_timestamps() {
        let mut i = 0;

        let base_ts: u64 = BASE_TS.try_into().unwrap();

        validate_timestamp(10_usize, BASE_TS - MAX_DATA_TIMESTAMP_DELAY_SECONDS + i, base_ts);
        validate_timestamp(10_usize, BASE_TS + MAX_DATA_TIMESTAMP_AHEAD_SECONDS - i, base_ts);

        i = 1;

        validate_timestamp(10_usize, BASE_TS - MAX_DATA_TIMESTAMP_DELAY_SECONDS + i, base_ts);
        validate_timestamp(10_usize, BASE_TS + MAX_DATA_TIMESTAMP_AHEAD_SECONDS - i, base_ts);
    }


    #[test]
    #[should_panic]
    fn test_validate_wrong_future_timestamp() {
        validate_timestamp(
            10_usize, BASE_TS + MAX_DATA_TIMESTAMP_AHEAD_SECONDS + 1, BASE_TS.try_into().unwrap()
        );
    }

    #[test]
    #[should_panic]
    fn test_validate_wrong_past_timestamp() {
        validate_timestamp(
            10_usize, BASE_TS - MAX_DATA_TIMESTAMP_DELAY_SECONDS - 1, BASE_TS.try_into().unwrap()
        );
    }
}
