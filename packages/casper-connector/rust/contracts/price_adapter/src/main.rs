#![no_std]
#![no_main]

extern crate alloc;
use price_adapter::PriceAdapter;
use redstone_casper::contracts::{
    contract::{contract_install, Contract},
    price_adapter_trait::{
        adapter_get_prices, adapter_read_prices, adapter_read_timestamp, adapter_write_prices,
    },
};

#[cfg(not(target_arch = "wasm32"))]
compile_error!("target arch should be wasm32: compile with '--target wasm32-unknown-unknown'");

mod config_preparator;
mod price_adapter;
mod price_adapter_contract;
mod price_adapter_error;
mod price_adapter_impl;

#[no_mangle]
#[inline]
pub extern "C" fn call() {
    contract_install::<PriceAdapter>();
}

#[no_mangle]
#[inline]
pub extern "C" fn init() {
    PriceAdapter::init();
}

#[no_mangle]
#[inline]
pub extern "C" fn write_prices() {
    adapter_write_prices::<PriceAdapter>();
}

#[no_mangle]
#[inline]
pub extern "C" fn get_prices() {
    adapter_get_prices::<PriceAdapter>();
}

#[no_mangle]
#[inline]
pub extern "C" fn read_prices() {
    adapter_read_prices::<PriceAdapter>();
}

#[no_mangle]
#[inline]
pub extern "C" fn read_timestamp() {
    adapter_read_timestamp::<PriceAdapter>();
}

#[no_mangle]
#[inline]
pub extern "C" fn read_price_and_timestamp() {
    PriceAdapter::read_price_and_timestamp();
}
