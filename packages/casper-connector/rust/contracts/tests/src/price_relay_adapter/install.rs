use casper_execution_engine::core::engine_state::execution_result::ExecutionResult;
use casper_types::{runtime_args, Key, RuntimeArgs};

use redstone_casper::contracts::constants::{ARG_NAME_ADAPTER_ADDRESS, ENTRY_POINT_INIT};

use crate::core::run_env::RunEnv;

impl RunEnv {
    pub(crate) const PRICE_RELAY_ADAPTER_KEY: &'static str = "price_relay_adapter";
    const PRICE_RELAY_ADAPTER_WASM: &'static str = "price_relay_adapter.wasm";

    pub(crate) fn deploy_price_relay_adapter(&mut self) -> Key {
        self.deploy(Self::PRICE_RELAY_ADAPTER_WASM, None)
    }

    pub(crate) fn install_price_relay_adapter(&mut self, adapter_key: Key) -> Key {
        let contract_key = self.deploy_price_relay_adapter();

        self.price_relay_adapter_init(adapter_key);

        contract_key
    }

    pub(crate) fn price_relay_adapter_init(&mut self, adapter_key: Key) -> &ExecutionResult {
        let args = runtime_args! {
            ARG_NAME_ADAPTER_ADDRESS => adapter_key
        };
        let init_result =
            self.call_entry_point(Self::PRICE_RELAY_ADAPTER_KEY, ENTRY_POINT_INIT, args);

        println!("Init: {:?}", init_result);

        init_result
    }
}
