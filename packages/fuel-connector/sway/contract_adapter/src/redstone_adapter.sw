contract;

use std::{
    bytes::Bytes,
    hash::*,
    storage::{
        storage_api::{
            read,
            write,
        },
        storage_vec::*,
    },
    vec::Vec,
};
use redstone::{core::{config::Config, processor::process_input}, utils::vec::*};
use common::{
    arr_wrap::ArrWrap,
    check::{
        check_timestamp,
        check_updater,
    },
    configurables::REDSTONE_PRIMARY_PROD_ALLOWED_SIGNERS,
    redstone_adapter_abi::RedStoneAdapter,
    redstone_core_abi::RedStoneCore,
    storage_keys::{
        FEED_IDS_SK,
        PRICES_SK,
        TIMESTAMP_SK,
    },
    timestamp::get_unix_timestamp,
    to_vec::ToVec,
    versioned_abi::Versioned,
};

const VERSION = 1;

configurable {
    SIGNER_COUNT_THRESHOLD: u64 = 1,
    ALLOWED_SIGNERS: [b256; 5] = REDSTONE_PRIMARY_PROD_ALLOWED_SIGNERS,
    TRUSTED_UPDATERS: [b256; 1] = [0x6b63804cfbf9856e68e5b6e7aef238dc8311ec55bec04df774003a2c96e0418e],
}

storage {
    prices in PRICES_SK: StorageMap<u256, u256> = StorageMap {},
    timestamp in TIMESTAMP_SK: u64 = 0,
    feed_ids in FEED_IDS_SK: StorageVec<u256> = StorageVec::<u256> {},
}

impl Versioned for Contract {
    fn get_version() -> u64 {
        VERSION
    }
}

impl RedStoneCore for Contract {
    #[storage(read)]
    fn get_prices(feed_ids: Vec<u256>, payload: Bytes) -> (Vec<u256>, u64) {
        process_payload(feed_ids, payload)
    }
}

impl RedStoneAdapter for Contract {
    #[storage(read)]
    fn read_timestamp() -> u64 {
        storage.timestamp.try_read().unwrap_or(0)
    }

    #[storage(read)]
    fn read_prices(feed_ids: Vec<u256>) -> Vec<Option<u256>> {
        let mut result = Vec::new();
        let mut i = 0;
        while (i < feed_ids.len()) {
            let feed_id = feed_ids.get(i).unwrap();
            let price = storage.prices.get(feed_id).try_read();
            result.push(price);
            i += 1;
        }

        result
    }

    #[storage(write)]
    fn write_prices(feed_ids: Vec<u256>, payload: Bytes) -> Vec<u256> {
        check_updater(TRUSTED_UPDATERS.to_vec());

        let (aggregated_values, timestamp) = process_payload(feed_ids, payload);
        overwrite_prices(feed_ids, aggregated_values, timestamp);

        aggregated_values
    }
}

#[storage(write)]
fn overwrite_prices(
    feed_ids: Vec<u256>,
    aggregated_values: Vec<u256>,
    timestamp: u64,
) {
    check_updater(TRUSTED_UPDATERS.to_vec());
    check_timestamp(timestamp, storage.timestamp.try_read());

    let mut i = 0;
    while (i < storage.feed_ids.len()) {
        let feed_id = storage.feed_ids.get(i).unwrap().read();
        if (feed_ids.index_of(feed_id) == None) {
            let _ = storage.prices.remove(feed_id);
        }

        i += 1;
    }

    let mut i = 0;
    while (i < feed_ids.len()) {
        let feed_id = feed_ids.get(i).unwrap();
        let price = aggregated_values.get(i).unwrap();
        storage.prices.insert(feed_id, price);

        i += 1;
    }

    storage.feed_ids.store_vec(feed_ids);
    storage.timestamp.write(timestamp);
}

fn process_payload(feed_ids: Vec<u256>, payload_bytes: Bytes) -> (Vec<u256>, u64) {
    let config = Config {
        feed_ids,
        signers: ALLOWED_SIGNERS.to_vec(),
        signer_count_threshold: SIGNER_COUNT_THRESHOLD,
        block_timestamp: get_unix_timestamp(),
    };

    process_input(payload_bytes, config)
}
