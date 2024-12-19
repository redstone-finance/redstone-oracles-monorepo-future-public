use crate::types::{process_feed_ids, process_payload_bytes, FeedIds, Payload, U256Digits};
use redstone::core::config::Config;

pub fn process_payload(
    block_timestamp: u64,
    signer_count_threshold: u8,
    signers: Vec<Vec<u8>>,
    feed_ids: FeedIds,
    payload: Payload,
) -> (u64, Vec<U256Digits>) {
    let config = Config {
        signer_count_threshold,
        signers,
        feed_ids: process_feed_ids(feed_ids),
        block_timestamp,
    };

    let result = redstone::core::processor::process_payload(config, process_payload_bytes(payload));
    let prices = result.values.iter().map(|v| v.to_digits()).collect();

    (result.min_timestamp, prices)
}
