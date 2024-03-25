extern crate alloc;

use crate::core::run_env::RunEnv;
use redstone::{
    helpers::hex::read_payload_bytes, network::casper::contracts::run_mode::RunMode::*,
};

pub fn run() {
    let mut env = RunEnv::prepare();
    let adapter_key = env.install_default_price_adapter();
    let _ = env.install_price_feed(adapter_key, "ETH");

    let payload = read_payload_bytes("../../scripts/sample-data/payload.hex").into();
    env.price_adapter_process_payload(Write, vec!["ETH", "BTC"], payload, None);

    env.price_feed_get_price_and_timestamp();
}
