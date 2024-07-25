library;

use std::{bytes::Bytes, vec::Vec};

abi RedStoneCore {
    /// The initializer of the RedStone Core contract
    /// It writes the params to the contract's storage
    ///
    ///
    /// # Arguments
    ///
    /// * `signers` - A vector of u256 representing the signers to be supported during payload processing.
    /// * `signer_count_threshold` - Threshold for the number of signers to be achieved to process the payload
    #[storage(write)]
    fn init(signers: Vec<b256>, signer_count_threshold: u64);
    /// The processor of the RedStone payload in the core-model.
    /// It doesn't modify the contract's storage
    ///
    ///
    /// # Arguments
    ///
    /// * `feed_ids` - A vector of u256 representing the feed_ids.
    /// * `payload` - Byte-list of the payload to be processed.
    #[storage(read)]
    fn get_prices(feed_ids: Vec<u256>, payload: Bytes) -> (Vec<u256>, u64);
}
