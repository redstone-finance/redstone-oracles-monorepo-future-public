script;

use std::{
    bytes::Bytes,
    inputs::input_owner,
    logging::log,
    tx::{
        tx_script_data_length,
        tx_script_data_start_pointer,
    },
    u256::U256,
};

abi Prices {
    fn get_prices(feed_ids: Vec<U256>, payload: Vec<u64>) -> [U256; 50];

    #[storage(read)]
    fn read_timestamp() -> u64;

    #[storage(read)]
    fn read_prices(feed_ids: Vec<U256>) -> [U256; 50];

    #[storage(write)]
    fn write_prices(feed_ids: Vec<U256>, payload: Vec<u64>) -> [U256; 50];
}

const AVAX = U256::from((0, 0, 0, 0x41564158));
const BTC = U256::from((0, 0, 0, 0x425443));
const ETH = U256::from((0, 0, 0, 0x455448));

fn main() {
    let mut feed_ids: Vec<U256> = Vec::with_capacity(3);
    feed_ids.push(AVAX);
    feed_ids.push(BTC);
    feed_ids.push(ETH);

    let prices = abi(Prices, CONTRACT_ID);

    let _ = prices.write_prices(feed_ids, tx_payload());
    let aggregated_values = prices.read_prices(feed_ids);

    let timestamp = prices.read_timestamp();
    log(timestamp);

    let mut i = 0;
    while (i < feed_ids.len) {
        log(aggregated_values[i]);
        i += 1;
    }
}

fn tx_payload() -> Vec<u64> {
    let input_length = tx_script_data_length();
    let mut bytes = Bytes::with_capacity(input_length);
    bytes.len = input_length;
    tx_script_data_start_pointer().copy_bytes_to(bytes.buf.ptr, input_length);

    let mut result: Vec<u64> = Vec::new();
    let mut i = 0;
    while (i < bytes.len) {
        result.push(bytes.get(i).unwrap());

        i += 1;
    }

    return result;
}
