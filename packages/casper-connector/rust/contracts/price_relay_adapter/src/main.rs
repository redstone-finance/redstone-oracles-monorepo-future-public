#![no_std]
#![no_main]

extern crate alloc;
use alloc::vec::Vec;

use casper_contract::contract_api::runtime;
use casper_types::{bytesrepr::Bytes, U256};

use price_relay_adapter::PriceRelayAdapter;
use redstone_casper::contracts::{
    constants::{ARG_NAME_FEED_IDS, ARG_NAME_PAYLOAD},
    contract::{contract_install, Contract},
    price_adapter_trait::{adapter_read_prices, adapter_read_timestamp, adapter_write_prices},
    run_mode::{
        RunMode,
        RunMode::{Get, Write},
    },
};

mod price_relay_adapter;
mod price_relay_adapter_contract;
mod price_relay_adapter_impl;
#[cfg(not(target_arch = "wasm32"))]
compile_error!("target arch should be wasm32: compile with '--target wasm32-unknown-unknown'");

#[no_mangle]
pub extern "C" fn call() {
    contract_install::<PriceRelayAdapter>()
}

#[no_mangle]
pub extern "C" fn init() {
    PriceRelayAdapter::init()
}

#[no_mangle]
pub extern "C" fn write_prices() {
    adapter_write_prices::<PriceRelayAdapter>();
}

#[no_mangle]
pub extern "C" fn get_prices() {
    let payload: Bytes = runtime::get_named_arg(ARG_NAME_PAYLOAD);
    let feed_ids: Vec<U256> = runtime::get_named_arg(ARG_NAME_FEED_IDS);

    PriceRelayAdapter::get_and_save_prices(feed_ids, payload, None);
}

#[no_mangle]
pub extern "C" fn read_prices() {
    adapter_read_prices::<PriceRelayAdapter>();
}

#[no_mangle]
pub extern "C" fn read_timestamp() {
    adapter_read_timestamp::<PriceRelayAdapter>();
}

#[no_mangle]
pub extern "C" fn get_prices_chunk() {
    process_chunk(Get);
}

#[no_mangle]
pub extern "C" fn write_prices_chunk() {
    process_chunk(Write);
}

fn process_chunk(mode: RunMode) -> ! {
    let payload = runtime::get_named_arg(ARG_NAME_PAYLOAD);
    let hash = runtime::get_named_arg(PriceRelayAdapter::ARG_NAME_HASH);
    let chunk_index: u8 = runtime::get_named_arg(PriceRelayAdapter::ARG_NAME_CHUNK_INDEX);

    PriceRelayAdapter::process_chunk(chunk_index.into(), hash, payload, mode)
}
