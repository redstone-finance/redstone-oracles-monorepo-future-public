use casper_execution_engine::core::engine_state::execution_result::ExecutionResult;
use casper_types::{runtime_args, Key, RuntimeArgs};

use redstone::helpers::hex::make_feed_id;
use redstone_casper::contracts::constants::{
    ARG_NAME_ADAPTER_ADDRESS, ARG_NAME_FEED_ID, ENTRY_POINT_INIT,
};

use crate::core::run_env::RunEnv;

impl RunEnv {
    pub(crate) const PRICE_FEED_KEY: &'static str = "price_feed";
    const PRICE_FEED_WASM: &'static str = "price_feed.wasm";

    pub(crate) fn deploy_price_feed(&mut self, package_key: Option<Key>) -> Key {
        self.deploy(Self::PRICE_FEED_WASM, package_key)
    }

    pub(crate) fn install_price_feed(&mut self, adapter_key: Key, feed_id: &str) -> Key {
        let contract_key = self.deploy_price_feed(None);

        self.price_feed_init(adapter_key, feed_id);

        contract_key
    }

    pub(crate) fn price_feed_init(&mut self, adapter_key: Key, feed_id: &str) -> &ExecutionResult {
        let args = runtime_args! {
            ARG_NAME_ADAPTER_ADDRESS => adapter_key,
            ARG_NAME_FEED_ID => make_feed_id(feed_id),
        };

        let init_result = self.call_entry_point(Self::PRICE_FEED_KEY, ENTRY_POINT_INIT, args);

        println!("Init: {:?}", init_result);

        init_result
    }
}
