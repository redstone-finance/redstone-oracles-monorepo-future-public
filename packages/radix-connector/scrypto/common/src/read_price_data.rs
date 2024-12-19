use crate::{
    price_adapter_error::PriceAdapterError,
    types::{process_feed_ids, FeedIds, ToDigits, U256Digits},
};
use redstone::{
    network::{as_str::AsAsciiStr, assert::Unwrap, error::Error},
    FeedId,
};
use scrypto::prelude::HashMap;
use std::fmt::Debug;

pub fn read_price_data<T: Debug + Clone>(
    prices: &HashMap<U256Digits, T>,
    feed_id: &FeedId,
    index: usize,
) -> T {
    prices
        .get(&feed_id.to_digits())
        .unwrap_or_revert(|_| {
            Error::contract_error(PriceAdapterError::MissingDataFeedValue(
                index,
                feed_id.as_ascii_str(),
            ))
        })
        .clone()
}

pub fn read_prices_data<T: Debug + Clone>(
    prices: &HashMap<U256Digits, T>,
    feed_ids: FeedIds,
) -> Vec<T> {
    process_feed_ids(feed_ids)
        .iter()
        .enumerate()
        .map(|(index, feed_id)| read_price_data(prices, feed_id, index))
        .collect()
}
