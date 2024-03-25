use crate::price_adapter::PriceAdapter;
use alloc::vec::Vec;
use casper_types::{bytesrepr::Bytes, U256};
use redstone::network::casper::contracts::{
    price_adapter_trait::PriceAdapterTrait,
    run_mode::RunMode::{Get, Write},
};

extern crate alloc;

impl PriceAdapterTrait for PriceAdapter {
    #[inline]
    fn write_prices(feed_ids: Vec<U256>, payload: Bytes) -> (u64, Vec<U256>) {
        Self::process_payload(feed_ids, payload, Write)
    }

    #[inline]
    fn get_prices(feed_ids: Vec<U256>, payload: Bytes) -> (u64, Vec<U256>) {
        Self::process_payload(feed_ids, payload, Get)
    }

    #[inline]
    fn read_prices(feed_ids: Vec<U256>) -> Vec<U256> {
        Self::read_values(feed_ids)
    }

    #[inline]
    fn read_timestamp() -> u64 {
        Self::read_timestamp()
    }
}
