script;

use std::{bytes::Bytes, logging::log, tx::{tx_script_data_length, tx_script_data_start_pointer,},};

configurable {
    CONTRACT_ID: b256 = 0x7534d8f17f42286497f18f44173f2a63c1fe1f91019170021547428c5410e4ad,
}

abi Prices {
    fn get_prices(feed_ids: Vec<u256>, payload: Bytes) -> (Vec<u256>, u64);
}

// const AVAX = 0x41564158u256;
const BTC = 0x425443u256;
const ETH = 0x455448u256;

fn main() {
    let mut feed_ids: Vec<u256> = Vec::with_capacity(3);
    // feed_ids.push(AVAX);
    feed_ids.push(BTC);
    feed_ids.push(ETH);

    let prices = abi(Prices, CONTRACT_ID);

    let (aggregated_values, timestamp) = prices.get_prices(feed_ids, tx_payload());
    log(timestamp);

    let mut i = 0;
    while (i < feed_ids.len()) {
        log(aggregated_values.get(i).unwrap());
        i += 1;
    }
}

fn tx_payload() -> Bytes {
    let input_length = tx_script_data_length();
    let mut bytes = Bytes::new();
    let mut i = 0;

    while (i < input_length) {
        bytes.push(0u8);
        i += 1;
    }

    tx_script_data_start_pointer()
        .copy_bytes_to(bytes.ptr(), input_length);

    bytes
}
