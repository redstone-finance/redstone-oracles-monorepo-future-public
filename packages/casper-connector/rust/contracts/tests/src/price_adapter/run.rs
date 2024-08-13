extern crate alloc;

use alloc::vec;

use casper_types::{runtime_args, runtime_args::RuntimeArgs};

use redstone::{
    helpers::hex::{make_feed_id, read_payload_bytes},
    network::as_str::AsAsciiStr,
};
use redstone_casper::contracts::{
    constants::{ARG_NAME_FEED_ID, ENTRY_POINT_READ_PRICE_AND_TIMESTAMP},
    run_mode::RunMode::*,
};

use crate::core::run_env::RunEnv;

pub fn run() {
    let mut env = RunEnv::prepare();
    env.install_default_price_adapter();

    let payload = read_payload_bytes("../../scripts/sample-data/payload.hex").into();
    println!("{:?}", make_feed_id("ETH").as_ascii_str());

    env.price_adapter_process_payload(Write, vec!["ETH", "BTC"], payload, None);

    let result = env.call_entry_point(
        RunEnv::PRICE_ADAPTER_KEY,
        ENTRY_POINT_READ_PRICE_AND_TIMESTAMP,
        runtime_args! { ARG_NAME_FEED_ID => make_feed_id("ETH") },
    );

    println!("{:?}", result);
}
