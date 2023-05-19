library config;

use std::{
    b256::*,
    block::timestamp,
    bytes::Bytes,
    logging::log,
    storage::{
        get,
        StorageVec,
    },
    u256::U256,
    vec::Vec,
};
use redstone::config::Config;

impl Config {
    #[storage(read)]
    pub fn base(
        feed_ids: Vec<U256>,
        signers: Vec<b256>,
        signer_count_threshold: u64,
    ) -> Config {
        let config = Config {
            feed_ids,
            signers,
            signer_count_threshold,
            block_timestamp: get_timestamp(),
        };

        return config;
    }
}

#[storage(read)]
fn get_timestamp() -> u64 {
    let block_timestamp = timestamp() - (10 + (1 << 62));

    return get_u64(FAKE_TIMESTAMP_KEY, block_timestamp);
}

#[storage(read)]
fn get_u64(key: b256, or_value: u64) -> u64 {
    let value = get(key).unwrap_or(U256::new());
    let mut config_value = value.d;
    if (config_value == 0) {
        config_value = or_value;
    }

    return config_value;
}
