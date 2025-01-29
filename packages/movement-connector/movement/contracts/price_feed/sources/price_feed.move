module price_feed::price_feed {
    // === Imports ===

    use redstone_price_adapter::price_adapter::{
        price_by_address,
        price_and_timestamp_by_address,
        timestamp_by_address,
        price_data_by_address
    };
    use redstone_price_adapter::price_data::PriceData;
    use std::string::{Self, String};

    // === Constants ===

    /// Eth feed id
    const FEED_ID: vector<u8> = x"4554480000000000000000000000000000000000000000000000000000000000";
    const DESCRIPTION: vector<u8> = b"RedStone Price Feed for ETH";
    const ADAPTER_ADDRESS: address = @price_adapter_object_address;

    // === Public-View Functions ===

    #[view]
    /// Returns ETH FeedId
    public fun get_data_feed_id(): String {
        string::utf8(FEED_ID)
    }

    #[view]
    /// Returns description of this package
    public fun description(): String {
        string::utf8(DESCRIPTION)
    }

    #[view]
    public fun decimals(): u64 {
        8
    }

    #[view]
    /// Returns latest ETH (price, timestamp) tuple from price_adapter
    public fun read_price_and_timestamp(): (u256, u64) {
        price_and_timestamp_by_address(ADAPTER_ADDRESS, FEED_ID)
    }

    #[view]
    /// Returns latest price of ETH, warning check timestamp
    public fun read_price(): u256 {
        price_by_address(ADAPTER_ADDRESS, FEED_ID)
    }

    #[view]
    /// Returns latest timestamp of ETH
    public fun read_timestamp(): u64 {
        timestamp_by_address(ADAPTER_ADDRESS, FEED_ID)
    }

    #[view]
    /// Returns ETH PriceData containg all informations, like price, timestamps.
    public fun read_price_data(): PriceData {
        price_data_by_address(ADAPTER_ADDRESS, FEED_ID)
    }
}
