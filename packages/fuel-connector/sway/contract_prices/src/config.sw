library;

use std::{
    bytes::Bytes,
    logging::log,
    primitive_conversions::u64::*,
    storage::{
        storage_api::read,
        storage_vec::*,
    },
    vec::Vec,
};
use common::timestamp::get_unix_timestamp;
use redstone::core::config::Config;

const FAKE_TIMESTAMP_KEY = 0x00000000000000000000000000000000000066616b655f74696d657374616d70;

impl Config {
    #[storage(read)]
    pub fn base(
        feed_ids: Vec<u256>,
        signers: Vec<b256>,
        signer_count_threshold: u64,
    ) -> Config {
        Self {
            feed_ids,
            signers,
            signer_count_threshold,
            block_timestamp: get_timestamp(),
        }
    }
}

#[storage(read)]
fn get_timestamp() -> u64 {
    let block_timestamp = get_unix_timestamp();

    get_u64(FAKE_TIMESTAMP_KEY, block_timestamp)
}

#[storage(read)]
fn get_u64(key: b256, or_value: u64) -> u64 {
    let value = read::<u256>(key, 0).unwrap_or(0x00u256);
    let mut config_value = u64::try_from(value).unwrap();
    if (config_value == 0) {
        config_value = or_value;
    }

    config_value
}
