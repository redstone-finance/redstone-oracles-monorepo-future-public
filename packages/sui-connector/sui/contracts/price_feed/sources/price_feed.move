module price_feed::price_feed;

use redstone_price_adapter::price_adapter::PriceAdapter;
use redstone_price_adapter::price_data::PriceData;
use std::string::{Self, String};

/// Eth feed id
const FEED_ID: vector<u8> = x"4554480000000000000000000000000000000000000000000000000000000000";
const DESCRIPTION: vector<u8> = b"RedStone Price Feed for ETH";

/// Returns ETH FeedId
public fun getDataFeedId(): String {
    string::utf8(FEED_ID)
}

/// Returns description of this package
public fun description(): String {
    string::utf8(DESCRIPTION)
}

/// Returns latest ETH (price, timestamp) tuple from price_adapter
public fun read_price_and_timestamp(price_adapter: &PriceAdapter): (u256, u64) {
    read_price_data(price_adapter).read_price_and_timestamp()
}

/// Returns latest price of ETH, warning check timestamp
public fun read_price(price_adapter: &PriceAdapter): u256 {
    read_price_data(price_adapter).price()
}

/// Returns ETH PriceData containg all informations, like price, timestamps.
public fun read_price_data(price_adapter: &PriceAdapter): &PriceData {
    price_adapter.get_price_data(FEED_ID)
}
