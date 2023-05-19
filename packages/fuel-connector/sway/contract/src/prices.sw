contract;

dep prices_abi;
dep config;

use std::{
    auth::msg_sender,
    bytes::Bytes,
    inputs::input_count,
    logging::log,
    storage::StorageVec,
    u256::U256,
    vec::Vec,
};
use redstone::{config::Config, processor::process_input};

use prices_abi::{empty_result, Prices};
use config::*;

storage {
    owner: Option<Identity> = Option::None,
    signer_count_threshold: u64 = 1,
    signers: StorageVec<b256> = StorageVec {},
    prices: StorageMap<U256, U256> = StorageMap {},
    timestamp: u64 = 0,
}

impl Prices for Contract {
    #[storage(read, write)]
    fn init(
        signers: Vec<b256>,
        signer_count_threshold: u64,
        skip_setting_owner: u64,
    ) {
        log(SALT); // tech purposes
        assert(storage.owner.is_none() || storage.owner.unwrap() == msg_sender().unwrap());
        if (skip_setting_owner == 0) {
            storage.owner = Option::Some(msg_sender().unwrap());
        }
        storage.signer_count_threshold = signer_count_threshold;
        storage.signers.clear();

        let mut i = 0;
        while (i < signers.len) {
            storage.signers.push(signers.get(i).unwrap());
            i += 1;
        }
    }

    #[storage(read)]
    fn get_prices(feed_ids: Vec<U256>, payload: Vec<u64>) -> [U256; 50] {
        let (prices, _) = get_prices(feed_ids, payload);

        return prices;
    }

    #[storage(read)]
    fn read_timestamp() -> u64 {
        return storage.timestamp;
    }

    #[storage(read)]
    fn read_prices(feed_ids: Vec<U256>) -> [U256; 50] {
        let mut result = empty_result;

        let mut i = 0;
        while (i < feed_ids.len) {
            let feed_id = feed_ids.get(i).unwrap();
            let price = storage.prices.get(feed_id);
            match price {
                Option::Some(value) => {
                    result[i] = value;
                },
                Option::None => {}
            }

            i += 1;
        }

        return result;
    }

    #[storage(read, write)]
    fn write_prices(feed_ids: Vec<U256>, payload: Vec<u64>) -> [U256; 50] {
        let (aggregated_values, block_timestamp) = get_prices(feed_ids, payload);
        let mut i = 0;
        while (i < feed_ids.len) {
            let feed_id = feed_ids.get(i).unwrap();
            let price = aggregated_values[i];
            storage.prices.insert(feed_id, price);

            i += 1;
        }

        storage.timestamp = block_timestamp;

        return aggregated_values;
    }
}

#[storage(read)]
fn get_prices(feed_ids: Vec<U256>, payload: Vec<u64>) -> ([U256; 50], u64) {
    let mut signers: Vec<b256> = Vec::new();
    let mut i = 0;
    while (i < storage.signers.len()) {
        signers.push(storage.signers.get(i).unwrap());

        i += 1;
    }

    let config = Config::base(feed_ids, signers, storage.signer_count_threshold);

    let mut payload_bytes = Bytes::new();
    let mut i = 0;
    while (i < payload.len) {
        payload_bytes.push(payload.get(i).unwrap());

        i += 1;
    }
    let (aggregated_values, timestamp) = process_input(payload_bytes, config);

    let mut prices = empty_result;

    let mut i = 0;
    while (i < aggregated_values.len) {
        prices[i] = aggregated_values.get(i).unwrap();

        i += 1;
    }
    return (prices, timestamp);
}
