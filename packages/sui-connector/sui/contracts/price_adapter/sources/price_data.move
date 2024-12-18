module redstone_price_adapter::price_data;

public struct PriceData has store {
    feed_id: vector<u8>,
    value: u256,
    timestamp: u64,
    write_timestamp: u64,
}

public fun price(data: &PriceData): u256 {
    data.value
}

public fun feed_id(data: &PriceData): vector<u8> {
    data.feed_id
}

public fun timestamp(data: &PriceData): u64 {
    data.timestamp
}

public fun write_timestamp(data: &PriceData): u64 {
    data.write_timestamp
}

public fun read_price_and_timestamp(data: &PriceData): (u256, u64) {
    (data.value, data.timestamp)
}

public fun default(feed_id: vector<u8>): PriceData {
    PriceData {
        feed_id: feed_id,
        value: 0,
        timestamp: 0,
        write_timestamp: 0,
    }
}

public fun overwrite(
    data: &mut PriceData,
    feed_id: vector<u8>,
    value: u256,
    timestamp: u64,
    write_timestamp: u64,
) {
    data.feed_id = feed_id;
    data.value = value;
    data.timestamp = timestamp;
    data.write_timestamp = write_timestamp;
}
