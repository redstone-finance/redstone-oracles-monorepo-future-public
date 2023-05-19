library prices_abi;

use std::{bytes::Bytes, u256::U256, vec::Vec};

abi Prices {
    #[storage(read, write)]
    fn init(signers: Vec<b256>, signer_count_threshold: u64, skip_setting_owner: u64);

    #[storage(read)]
    fn get_prices(feed_ids: Vec<U256>, payload: Vec<u64>) -> [U256; 50];

    #[storage(read)]
    fn read_timestamp() -> u64;

    #[storage(read)]
    fn read_prices(feed_ids: Vec<U256>) -> [U256; 50];

    #[storage(write, read)]
    fn write_prices(feed_ids: Vec<U256>, payload: Vec<u64>) -> [U256; 50];
}

pub const empty_result: [U256; 50] = [
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
    U256::new(),
];
