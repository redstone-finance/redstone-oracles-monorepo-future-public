use casper_contract::contract_api::runtime;
use casper_types::{
    bytesrepr::Bytes,
    CLType::{List, Tuple2, U256 as CLU256, U64},
    EntryPoints, Parameter, U256,
};

use crate::contracts::{
    constants::{
        ARG_NAME_FEED_IDS, ARG_NAME_PAYLOAD, ENTRY_POINT_GET_PRICES, ENTRY_POINT_READ_PRICES,
        ENTRY_POINT_READ_TIMESTAMP, ENTRY_POINT_WRITE_PRICES,
    },
    contract::Contract,
    entry_point::{cltype_bytes, cltype_values, ToEntryPoint},
    runtime::return_value,
};

pub trait PriceAdapterTrait: Contract {
    fn write_prices(feed_ids: Vec<U256>, payload: Bytes) -> (u64, Vec<U256>);
    fn get_prices(feed_ids: Vec<U256>, payload: Bytes) -> (u64, Vec<U256>);
    fn read_prices(feed_ids: Vec<U256>) -> Vec<U256>;
    fn read_timestamp() -> u64;
}

#[inline]
pub fn adapter_entry_points() -> EntryPoints {
    let mut entry_points = EntryPoints::new();

    vec![ENTRY_POINT_WRITE_PRICES, ENTRY_POINT_GET_PRICES]
        .iter()
        .for_each(|ep| {
            entry_points.add_entry_point(ep.entry_point(
                vec![
                    Parameter::new(ARG_NAME_FEED_IDS, List(CLU256.into())),
                    Parameter::new(ARG_NAME_PAYLOAD, cltype_bytes()),
                ],
                Tuple2([U64.into(), cltype_values().into()]),
            ))
        });

    entry_points.add_entry_point(ENTRY_POINT_READ_PRICES.entry_point(
        vec![Parameter::new(ARG_NAME_FEED_IDS, List(CLU256.into()))],
        cltype_values(),
    ));

    entry_points.add_entry_point(ENTRY_POINT_READ_TIMESTAMP.entry_point_no_params(U64));

    entry_points
}

#[inline]
pub fn adapter_write_prices<Adapter: PriceAdapterTrait>() -> ! {
    let feed_ids: Vec<U256> = runtime::get_named_arg(ARG_NAME_FEED_IDS);
    let payload: Bytes = runtime::get_named_arg(ARG_NAME_PAYLOAD);

    let result = Adapter::write_prices(feed_ids, payload);

    return_value(result)
}

#[inline]
pub fn adapter_get_prices<Adapter: PriceAdapterTrait>() -> ! {
    let feed_ids: Vec<U256> = runtime::get_named_arg(ARG_NAME_FEED_IDS);
    let payload: Bytes = runtime::get_named_arg(ARG_NAME_PAYLOAD);

    let result = Adapter::get_prices(feed_ids, payload);

    return_value(result)
}

#[inline]
pub fn adapter_read_prices<Adapter: PriceAdapterTrait>() -> ! {
    let feed_ids: Vec<U256> = runtime::get_named_arg(ARG_NAME_FEED_IDS);

    let result = Adapter::read_prices(feed_ids);

    return_value(result)
}

#[inline]
pub fn adapter_read_timestamp<Adapter: PriceAdapterTrait>() -> ! {
    let result = Adapter::read_timestamp();

    return_value(result)
}
