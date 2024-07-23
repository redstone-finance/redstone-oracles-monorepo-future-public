library;

use std::{bytes::Bytes, vec::Vec};

abi Prices {
    #[storage(write)]
    fn init(signers: Vec<b256>, signer_count_threshold: u64);

    #[storage(read)]
    fn get_prices(feed_ids: Vec<u256>, payload: Bytes) -> Vec<u256>;

    #[storage(read)]
    fn read_timestamp() -> u64;

    #[storage(read)]
    fn read_prices(feed_ids: Vec<u256>) -> Vec<u256>;

    #[storage(write)]
    fn write_prices(feed_ids: Vec<u256>, payload: Bytes) -> Vec<u256>;
}
