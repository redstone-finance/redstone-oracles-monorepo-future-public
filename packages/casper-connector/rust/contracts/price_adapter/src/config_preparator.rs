use alloc::vec::Vec;

use casper_contract::contract_api::runtime;
use casper_types::U256;

use redstone::core::config::Config;
use redstone_casper::contracts::{constants::ARG_NAME_CURRENT_TIMESTAMP, runtime::read_key_value};

use crate::price_adapter::PriceAdapter;

pub trait ConfigPreparator {
    fn prepare_with(feed_ids: Vec<U256>) -> Config;
}

impl ConfigPreparator for Config {
    #[inline]
    fn prepare_with(feed_ids: Vec<U256>) -> Config {
        let mut block_timestamp = runtime::get_blocktime().into();

        if block_timestamp == 0 {
            block_timestamp = runtime::get_named_arg::<u64>(ARG_NAME_CURRENT_TIMESTAMP) * 1000;
        }

        let signer_count_threshold =
            read_key_value(PriceAdapter::STORAGE_KEY_SIGNER_COUNT_THRESHOLD);
        let signers = read_key_value(PriceAdapter::STORAGE_KEY_SIGNERS);

        Config {
            signer_count_threshold,
            feed_ids,
            signers,
            block_timestamp,
        }
    }
}
