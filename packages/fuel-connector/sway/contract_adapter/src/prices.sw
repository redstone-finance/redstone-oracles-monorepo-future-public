contract;

mod prices_abi;

use std::{
    auth::msg_sender,
    block::timestamp,
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

storage {
    owner: Option<Identity> = None,
    signer_count_threshold: u64 = 1,
    signers: StorageVec<b256> = StorageVec::<b256> {},
    prices: StorageMap<u256, u256> = StorageMap {},
    timestamp: u64 = 0,
    updaters: StorageVec<Identity> = StorageVec::<Identity> {},
}

impl Prices for Contract {
    #[storage(write)]
    fn init(
        signers: Vec<b256>,
        signer_count_threshold: u64,
        updaters: Vec<Identity>,
    ) {
        assert(signers.len() >= signer_count_threshold);

        let storage_owner = storage.owner.read();
        assert(storage_owner.is_none() || (storage_owner.unwrap() == msg_sender().unwrap()));

        storage.owner.write(Some(msg_sender().unwrap()));
        storage.signer_count_threshold.write(signer_count_threshold);
        storage.signers.store_vec(signers);
        storage.updaters.store_vec(updaters);
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
        check_updater();

        let (aggregated_values, timestamp) = process_payload(feed_ids, payload);

        assert(timestamp > storage.timestamp.read());
        storage.timestamp.write(timestamp);

        let mut i = 0;
        while (i < feed_ids.len()) {
            let feed_id = feed_ids.get(i).unwrap();
            let price = aggregated_values.get(i).unwrap();
            storage.prices.insert(feed_id, price);

            i += 1;
        }

        aggregated_values
    }
}

#[storage(read)]
fn check_updater() {
    let owner = storage.owner.read();
    assert(owner.is_some());

    let sender = msg_sender().unwrap();
    if (owner.unwrap() == sender) {
        return;
    }

    assert(storage.updaters.load_vec().index_of(sender).is_some());
}

#[storage(read)]
fn process_payload(feed_ids: Vec<u256>, payload_bytes: Bytes) -> (Vec<u256>, u64) {
    let config = Config {
        feed_ids,
        signers: storage.signers.load_vec(),
        signer_count_threshold: storage.signer_count_threshold.read(),
        block_timestamp: timestamp() - (10 + (1 << 62)),
    };

    process_input(payload_bytes, config)
}

#[test]
fn test_init() {
    let prices = abi(Prices, CONTRACT_ID);

    prices.init(
        Vec::<b256>::new()
            .with(0x00000000000000000000000012470f7aba85c8b81d63137dd5925d6ee114952b),
        1,
    );
}

#[test(should_revert)]
fn test_init_should_revert_on_wrong_signer_count() {
    let prices = abi(Prices, CONTRACT_ID);

    prices.init(Vec::new(), 1);
}
