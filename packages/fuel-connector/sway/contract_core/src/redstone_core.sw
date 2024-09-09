contract;

mod redstone_core_abi;

use std::{
    auth::msg_sender,
    block::timestamp,
    bytes::Bytes,
    constants::ZERO_U256,
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
use redstone_core_abi::RedStoneCore;

storage {
    owner: Option<Identity> = None,
    signer_count_threshold: u64 = 1,
    signers: StorageVec<b256> = StorageVec::<b256> {},
}

impl RedStoneCore for Contract {
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
    fn get_prices(feed_ids: Vec<u256>, payload_bytes: Bytes) -> (Vec<u256>, u64) {
        let config = Config {
            feed_ids,
            signers: storage.signers.load_vec(),
            signer_count_threshold: storage.signer_count_threshold.read(),
            block_timestamp: timestamp() - (10 + (1 << 62)),
        };

        process_input(payload_bytes, config)
    }
}

#[test]
fn test_init() {
    let prices = abi(RedStoneCore, CONTRACT_ID);

    prices.init(
        Vec::<b256>::new()
            .with(0x00000000000000000000000012470f7aba85c8b81d63137dd5925d6ee114952b),
        1,
    );
}

#[test(should_revert)]
fn test_init_should_revert_on_wrong_signer_count() {
    let prices = abi(RedStoneCore, CONTRACT_ID);

    prices.init(Vec::new(), 1);
}
