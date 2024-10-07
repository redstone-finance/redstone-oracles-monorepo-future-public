library;

use std::{bytes::Bytes, vec::Vec};

abi RedStoneCore {
    /// The function processes on-chain the `payload` passed as an argument
    /// and returns an array of aggregated values for each feed passed as an identifier inside `feed_ids`,
    /// as well as the timestamp of the aggregated prices.
    ///
    ///
    /// # Arguments
    ///
    /// * `feed_ids` - A vector of u256 representing the feed_ids.
    /// * `payload` - Byte-list of the payload to be processed.
    #[storage(read)]
    fn get_prices(feed_ids: Vec<u256>, payload: Bytes) -> (Vec<u256>, u64);
}
