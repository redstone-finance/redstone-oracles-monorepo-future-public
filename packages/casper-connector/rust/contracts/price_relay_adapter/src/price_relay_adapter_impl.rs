use alloc::vec::Vec;

use casper_contract::contract_api::runtime;
use casper_types::{bytesrepr::Bytes, runtime_args, runtime_args::RuntimeArgs, U256};

use redstone_casper::contracts::{
    constants::{
        ARG_NAME_CURRENT_TIMESTAMP, ARG_NAME_FEED_IDS, ARG_NAME_PAYLOAD, ENTRY_POINT_GET_PRICES,
        ENTRY_POINT_READ_PRICES, ENTRY_POINT_READ_TIMESTAMP, ENTRY_POINT_WRITE_PRICES,
        STORAGE_KEY_ADAPTER_ADDRESS,
    },
    price_adapter_trait::PriceAdapterTrait,
    runtime::read_key_value,
};

use crate::price_relay_adapter::PriceRelayAdapter;

impl PriceAdapterTrait for PriceRelayAdapter {
    fn write_prices(feed_ids: Vec<U256>, payload: Bytes) -> (u64, Vec<U256>) {
        let mut args = runtime_args! {
           ARG_NAME_PAYLOAD => &payload,
            ARG_NAME_FEED_IDS => &feed_ids
        };

        Self::maybe_stub_block_timestamp(&mut args);

        runtime::call_versioned_contract(
            read_key_value(STORAGE_KEY_ADAPTER_ADDRESS),
            None,
            ENTRY_POINT_WRITE_PRICES,
            args,
        )
    }

    fn get_prices(feed_ids: Vec<U256>, payload: Bytes) -> (u64, Vec<U256>) {
        let mut args = runtime_args! {
           ARG_NAME_PAYLOAD => &payload,
            ARG_NAME_FEED_IDS => &feed_ids
        };

        Self::maybe_stub_block_timestamp(&mut args);

        runtime::call_versioned_contract(
            read_key_value(STORAGE_KEY_ADAPTER_ADDRESS),
            None,
            ENTRY_POINT_GET_PRICES,
            args,
        )
    }

    fn read_prices(feed_ids: Vec<U256>) -> Vec<U256> {
        let args = runtime_args! {
            ARG_NAME_FEED_IDS => &feed_ids
        };

        runtime::call_versioned_contract(
            read_key_value(STORAGE_KEY_ADAPTER_ADDRESS),
            None,
            ENTRY_POINT_READ_PRICES,
            args,
        )
    }

    fn read_timestamp() -> u64 {
        runtime::call_versioned_contract(
            read_key_value(STORAGE_KEY_ADAPTER_ADDRESS),
            None,
            ENTRY_POINT_READ_TIMESTAMP,
            RuntimeArgs::new(),
        )
    }
}

impl PriceRelayAdapter {
    fn maybe_stub_block_timestamp(args: &mut RuntimeArgs) {
        let block_timestamp: u64 = runtime::get_blocktime().into();

        if block_timestamp == 0 {
            args.insert(
                ARG_NAME_CURRENT_TIMESTAMP,
                runtime::get_named_arg::<u64>(ARG_NAME_CURRENT_TIMESTAMP),
            )
            .unwrap();
        }
    }
}
