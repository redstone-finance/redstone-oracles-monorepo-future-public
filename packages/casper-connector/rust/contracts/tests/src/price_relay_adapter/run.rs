extern crate alloc;

use crate::core::run_env::RunEnv;
use redstone::{
    helpers::hex::read_payload_bytes, network::casper::contracts::run_mode::RunMode::*,
};

pub fn run() {
    let mut env = RunEnv::prepare();
    let adapter_key = env.install_default_price_adapter();
    let _ = env.install_price_relay_adapter(adapter_key);

    env.price_relay_adapter_process_payload(
        Get,
        &["ETH", "BTC"],
        read_payload_bytes("../../scripts/sample-data/payload.hex").into(),
        None,
        true,
    );

    env.price_relay_adapter_process_payload(
        Get,
        &["ETH"],
        read_payload_bytes("../../scripts/sample-data/payload.hex").into(),
        None,
        false,
    );
}
