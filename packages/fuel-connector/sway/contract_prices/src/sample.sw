library;

use std::{block::timestamp, bytes::Bytes};
use redstone::{core::config::Config, core::processor::process_input, utils::vec::*};

fn get_timestamp() -> u64 {
    timestamp() - (10 + (1 << 62))
}

fn process_payload(feed_ids: Vec<u256>, payload_bytes: Bytes) -> (Vec<u256>, u64) {
    let signers = Vec::<b256>::new().with(0x00000000000000000000000012470f7aba85c8b81d63137dd5925d6ee114952b); // for example, a Vec<b256> configured in the contract
    let signer_count_threshold = 1; // for example, a value stored in the contract
    let config = Config {
        feed_ids,
        signers,
        signer_count_threshold,
        block_timestamp: get_timestamp(),
    };

    process_input(payload_bytes, config)
}
