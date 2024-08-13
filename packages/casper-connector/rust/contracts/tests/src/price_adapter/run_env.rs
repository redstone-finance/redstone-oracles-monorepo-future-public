use casper_types::{bytesrepr::Bytes, runtime_args, runtime_args::RuntimeArgs, U256};

use redstone::helpers::hex::make_feed_ids;
use redstone_casper::contracts::{
    constants::{
        ARG_NAME_CURRENT_TIMESTAMP, ARG_NAME_FEED_IDS, ARG_NAME_PAYLOAD, ENTRY_POINT_GET_PRICES,
        ENTRY_POINT_WRITE_PRICES, STORAGE_KEY_TIMESTAMP, STORAGE_KEY_VALUES,
    },
    run_mode::{RunMode, RunMode::*},
};

use crate::core::{run_env::RunEnv, utils::get_system_timestamp};

impl RunEnv {
    pub(crate) fn price_adapter_process_payload(
        &mut self,
        mode: RunMode,
        feed_ids: Vec<&str>,
        payload: Bytes,
        current_timestamp: Option<u64>,
    ) {
        let feed_ids = make_feed_ids(feed_ids);

        let current_timestamp = current_timestamp.unwrap_or(get_system_timestamp());

        let execution_result = self.call_entry_point(
            Self::PRICE_ADAPTER_KEY,
            if let Write = mode { ENTRY_POINT_WRITE_PRICES } else { ENTRY_POINT_GET_PRICES },
            runtime_args! { ARG_NAME_PAYLOAD => &payload, ARG_NAME_CURRENT_TIMESTAMP => current_timestamp, ARG_NAME_FEED_IDS => &feed_ids },
        );

        println!("{:?}", execution_result);

        if let Get = mode {
            return;
        }

        let timestamp = self.price_adapter_read_timestamp();
        let result = self.price_adapter_read_price("ETH");

        println!("{} {:?}", timestamp, result);
    }

    pub(crate) fn price_adapter_read_price(&mut self, feed_id: &str) -> U256 {
        self.unpack(self.query_contract_dic(Self::PRICE_ADAPTER_KEY, STORAGE_KEY_VALUES, feed_id))
    }

    pub(crate) fn price_adapter_read_timestamp(&mut self) -> u64 {
        self.unpack(self.query_contract(Self::PRICE_ADAPTER_KEY, STORAGE_KEY_TIMESTAMP))
    }
}
