use casper_contract::contract_api::{runtime, storage};
use casper_types::{runtime_args, runtime_args::RuntimeArgs, U256};

use redstone_casper::contracts::{
    constants::{
        ARG_NAME_FEED_ID, ENTRY_POINT_READ_PRICE_AND_TIMESTAMP, STORAGE_KEY_ADAPTER_ADDRESS,
        STORAGE_KEY_TIMESTAMP, STORAGE_KEY_VALUE,
    },
    runtime::{read_key_value, read_uref_key, return_value},
};

pub(crate) struct PriceFeed;

impl PriceFeed {
    pub(crate) const ENTRY_POINT_GET_PRICE_AND_TIMESTAMP: &'static str = "get_price_and_timestamp";
    pub(crate) const STORAGE_KEY_FEED_ID: &'static str = ARG_NAME_FEED_ID;

    pub(crate) fn get_price_and_timestamp() -> ! {
        let feed_id: U256 = read_key_value::<U256>(Self::STORAGE_KEY_FEED_ID);
        let (value, timestamp): (U256, u64) = runtime::call_versioned_contract(
            read_key_value(STORAGE_KEY_ADAPTER_ADDRESS),
            None,
            ENTRY_POINT_READ_PRICE_AND_TIMESTAMP,
            runtime_args! { ARG_NAME_FEED_ID => feed_id },
        );

        let (_, uref): (u64, _) = read_uref_key(STORAGE_KEY_TIMESTAMP);
        storage::write(uref, timestamp);

        if value > U256::zero() {
            let (_, uref): (U256, _) = read_uref_key(STORAGE_KEY_VALUE);
            storage::write(uref, value);
        }

        return_value((value, timestamp))
    }
}
