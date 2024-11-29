use crate::env::run_mode::RunMode;
use price_adapter::{
    price_adapter::price_adapter_test::PriceAdapterState,
    types::types::{FeedIds, Payload, Signers},
};
use redstone::network::specific::U256;

pub trait PriceAdapterRunEnv {
    fn instantiate(unique_signer_count: u8, signers: Signers, timestamp: Option<u64>) -> Self;
    #[allow(dead_code)]
    fn state(&self) -> PriceAdapterState;
    fn read_timestamp(&mut self) -> u64;
    fn read_prices(&mut self, feed_ids: FeedIds) -> Vec<U256>;
    fn process_payload(
        &mut self,
        run_mode: RunMode,
        payload: Payload,
        feed_ids: FeedIds,
        timestamp: u64,
    ) -> (u64, Vec<U256>);
}
