script;

use std::{bytes::Bytes, logging::log, tx::{tx_script_data, tx_script_data_length,},};
use common::redstone_adapter_abi::RedStoneAdapter;

configurable {
    CONTRACT_ID: b256 = 0x6c6020e293bded85a5db6ab57d9f41e9401c6576a58d4362ea26f373450c3acd,
}

// const AVAX = 0x41564158u256;
const BTC = 0x425443u256;
const ETH = 0x455448u256;

fn main() {
    let mut feed_ids: Vec<u256> = Vec::with_capacity(3);
    // feed_ids.push(AVAX);
    feed_ids.push(BTC);
    feed_ids.push(ETH);

    let prices = abi(RedStoneAdapter, CONTRACT_ID);

    let _ = prices.read_prices(feed_ids);
    let _ = prices.read_timestamp();

    let _ = prices.write_prices(feed_ids, tx_payload());
    let aggregated_values = prices.read_prices(feed_ids);

    let timestamp = prices.read_timestamp();
    log(timestamp);

    let mut i = 0;
    while (i < feed_ids.len()) {
        log(aggregated_values.get(i).unwrap().unwrap());
        i += 1;
    }
}

const GTF_SCRIPT_SCRIPT_DATA = 0x00A;

fn tx_script_data_start_pointer() -> raw_ptr {
    __gtf::<raw_ptr>(0, GTF_SCRIPT_SCRIPT_DATA)
}

fn tx_payload() -> Bytes {
    let input_length = tx_script_data_length().unwrap();
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
