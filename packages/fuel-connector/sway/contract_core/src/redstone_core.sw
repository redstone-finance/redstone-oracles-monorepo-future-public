contract;

use std::{bytes::Bytes, vec::Vec};
use redstone::{core::{config::Config, processor::process_input}, utils::vec::*};
use common::{
    arr_wrap::ArrWrap,
    configurables::REDSTONE_PRIMARY_PROD_ALLOWED_SIGNERS,
    metadata_abi::Metadata,
    redstone_core_abi::RedStoneCore,
    timestamp::get_unix_timestamp,
    to_vec::ToVec,
};

const VERSION = 1;

configurable {
    SIGNER_COUNT_THRESHOLD: u64 = 1,
    ALLOWED_SIGNERS: [b256; 5] = REDSTONE_PRIMARY_PROD_ALLOWED_SIGNERS,
}

impl Metadata for Contract {
    fn get_version() -> u64 {
        VERSION
    }

    fn get_unique_signer_threshold() -> u64 {
        SIGNER_COUNT_THRESHOLD
    }
}

impl RedStoneCore for Contract {
    #[storage(read)]
    fn get_prices(feed_ids: Vec<u256>, payload_bytes: Bytes) -> (Vec<u256>, u64) {
        let config = Config {
            feed_ids,
            signers: ALLOWED_SIGNERS.to_vec(),
            signer_count_threshold: SIGNER_COUNT_THRESHOLD,
            block_timestamp: get_unix_timestamp(),
        };

        process_input(payload_bytes, config)
    }
}
