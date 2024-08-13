#![no_std]
#![no_main]

extern crate alloc;
use price_feed::PriceFeed;
use redstone_casper::contracts::contract::{contract_install, Contract};

mod price_feed;
mod price_feed_contract;

#[cfg(not(target_arch = "wasm32"))]
compile_error!("target arch should be wasm32: compile with '--target wasm32-unknown-unknown'");

#[no_mangle]
pub extern "C" fn call() {
    contract_install::<PriceFeed>();
}

#[no_mangle]
pub extern "C" fn init() {
    PriceFeed::init();
}

#[no_mangle]
pub extern "C" fn get_price_and_timestamp() {
    PriceFeed::get_price_and_timestamp();
}
