use alloc::vec;

use casper_contract::contract_api::runtime;
use casper_types::{
    CLType::{Key as CLKey, Tuple2, Unit, U256 as CLU256, U64},
    EntryPoints, Parameter, U256,
};

use redstone_casper::contracts::{
    constants::{
        ARG_NAME_ADAPTER_ADDRESS, ARG_NAME_FEED_ID, ENTRY_POINT_INIT, GROUP_NAME_OWNER,
        STORAGE_KEY_ADAPTER_ADDRESS, STORAGE_KEY_TIMESTAMP, STORAGE_KEY_VALUE,
    },
    contract::Contract,
    entry_point::ToEntryPoint,
    runtime::{get_named_contract_package_hash, set_up_uref_key},
};

use crate::price_feed::PriceFeed;

impl Contract for PriceFeed {
    const CONTRACT_KEY: &'static str = "price_feed";

    fn entry_points() -> EntryPoints {
        let mut entry_points = EntryPoints::new();

        entry_points.add_entry_point(ENTRY_POINT_INIT.ownable_entry_point(
            vec![
                Parameter::new(ARG_NAME_ADAPTER_ADDRESS, CLKey),
                Parameter::new(ARG_NAME_FEED_ID, CLU256),
            ],
            Unit,
            GROUP_NAME_OWNER,
        ));

        entry_points.add_entry_point(
            Self::ENTRY_POINT_GET_PRICE_AND_TIMESTAMP
                .entry_point_no_params(Tuple2([CLU256.into(), U64.into()])),
        );

        entry_points
    }

    fn init() {
        let feed_id: U256 = runtime::get_named_arg(ARG_NAME_FEED_ID);
        let adapter_hash = get_named_contract_package_hash(ARG_NAME_ADAPTER_ADDRESS);

        set_up_uref_key(STORAGE_KEY_ADAPTER_ADDRESS, adapter_hash, true);
        set_up_uref_key(Self::STORAGE_KEY_FEED_ID, feed_id, true);
        set_up_uref_key(STORAGE_KEY_TIMESTAMP, 0u64, false);
        set_up_uref_key(STORAGE_KEY_VALUE, U256::zero(), false);
    }
}
