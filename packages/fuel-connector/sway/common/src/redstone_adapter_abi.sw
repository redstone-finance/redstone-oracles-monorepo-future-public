library;

use std::{bytes::Bytes, vec::Vec};

abi RedStoneAdapter {
    /// This function saves the aggregated values to the contract's storage and returns them as an array.
    /// The values persist in the contract's storage and then can be read by using `read_prices` function.
    /// The timestamp of the saved data can be retrieved using the `read_timestamp` function.
    ///
    ///
    /// # Arguments
    ///
    /// * `feed_ids` - A vector of u256 representing the feed_ids.
    /// * `payload` - Byte-list of the payload to be processed.
    #[storage(write)]
    fn write_prices(feed_ids: Vec<u256>, payload: Bytes) -> Vec<u256>;

    /// Returns the timestamp of data last saved/written to the contract's storage by using `write_prices` function -
    /// or zero when no data was previously written.
    #[storage(read)]
    fn read_timestamp() -> u64;

    ///
    /// The function reads the values persisting in the contract's storage and returns an array corresponding to the
    /// passed `feed_ids`.
    /// The function doesn't modify the storage and can read only aggregated values of the `feed_ids` saved by
    /// using `write_prices` function, as optionals (`Option::None` for non-existing values).
    ///
    ///
    /// # Arguments
    ///
    /// * `feed_ids` - A vector of u256 representing the feed_ids.
    #[storage(read)]
    fn read_prices(feed_ids: Vec<u256>) -> Vec<Option<u256>>;
}
