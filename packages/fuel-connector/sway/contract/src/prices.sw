contract;

mod prices_abi;
mod config;
// mod sample;

use std::{
    auth::msg_sender,
    bytes::Bytes,
    constants::ZERO_U256,
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
use prices_abi::Prices;
use config::*;

storage {
    owner: Option<Identity> = None,
    signer_count_threshold: u64 = 1,
    signers: StorageVec<b256> = StorageVec::<b256> {},
    feed_ids: StorageVec<u256> = StorageVec::<u256> {},
    prices: StorageMap<u256, u256> = StorageMap {},
    timestamp: u64 = 0,
}

impl Prices for Contract {
    #[storage(write)]
    fn init(signers: Vec<b256>, signer_count_threshold: u64) {
        assert(signers.len() >= signer_count_threshold);

        let storage_owner = storage.owner.read();
        assert(storage_owner.is_none() || (storage_owner.unwrap() == msg_sender().unwrap()));

        storage.owner.write(Some(msg_sender().unwrap()));
        storage.signer_count_threshold.write(signer_count_threshold);
        storage.signers.store_vec(signers);
    }

    #[storage(read)]
    fn get_prices(feed_ids: Vec<u256>, payload: Bytes) -> Vec<u256> {
        let (prices, _) = process_payload(feed_ids, payload);

        prices
    }

    #[storage(read)]
    fn read_timestamp() -> u64 {
        storage.timestamp.read()
    }

    #[storage(read)]
    fn read_prices(feed_ids: Vec<u256>) -> Vec<u256> {
        let mut result = Vec::new();
        let mut i = 0;
        while (i < feed_ids.len()) {
            let feed_id = feed_ids.get(i).unwrap();
            let price = storage.prices.get(feed_id).try_read().unwrap_or(ZERO_U256);
            result.push(price);
            i += 1;
        }

        result
    }

    #[storage(write)]
    fn write_prices(feed_ids: Vec<u256>, payload: Bytes) -> Vec<u256> {
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
    assert(timestamp > storage.timestamp.read());

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

#[storage(read)]
fn process_payload(feed_ids: Vec<u256>, payload_bytes: Bytes) -> (Vec<u256>, u64) {
    let config = Config::base(
        feed_ids,
        storage
            .signers
            .load_vec(),
        storage
            .signer_count_threshold
            .read(),
    );

    process_input(payload_bytes, config)
}

#[test]
fn test_init() {
    let prices = abi(Prices, CONTRACT_ID);

    prices.init(
        Vec::new()
            .with(0x00000000000000000000000012470f7aba85c8b81d63137dd5925d6ee114952b),
        1,
    );
}

#[test(should_revert)]
fn test_init_should_revert_on_wrong_signer_count() {
    let prices = abi(Prices, CONTRACT_ID);

    prices.init(Vec::new(), 1);
}
