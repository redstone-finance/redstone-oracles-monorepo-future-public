use casper_types::{RuntimeArgs, U256};

use redstone_casper::contracts::constants::{STORAGE_KEY_TIMESTAMP, STORAGE_KEY_VALUE};

use crate::core::run_env::RunEnv;

impl RunEnv {
    const ENTRY_POINT_GET_PRICE_AND_TIMESTAMP: &'static str = "get_price_and_timestamp";

    pub(crate) fn price_feed_get_price_and_timestamp(&mut self) -> (U256, u64) {
        let execution_result = self.call_entry_point(
            Self::PRICE_FEED_KEY,
            Self::ENTRY_POINT_GET_PRICE_AND_TIMESTAMP,
            RuntimeArgs::new(),
        );

        println!("{:?}", execution_result);

        let value = self.price_feed_read_price();
        let timestamp = self.price_feed_read_timestamp();

        println!("{} {:?}", timestamp, value);

        (value, timestamp)
    }

    pub(crate) fn price_feed_read_price(&mut self) -> U256 {
        self.unpack(self.query_contract(Self::PRICE_FEED_KEY, STORAGE_KEY_VALUE))
    }

    pub(crate) fn price_feed_read_timestamp(&mut self) -> u64 {
        self.unpack(self.query_contract(Self::PRICE_FEED_KEY, STORAGE_KEY_TIMESTAMP))
    }
}
