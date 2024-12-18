module redstone_price_adapter::redstone_sdk_data_package;

public struct DataPackage has copy, drop {
    signer_address: vector<u8>,
    timestamp: u64,
    data_points: vector<DataPoint>,
}

public struct DataPoint has copy, drop {
    feed_id: vector<u8>,
    value: vector<u8>,
}

public fun new_data_package(
    signer_address: vector<u8>,
    timestamp: u64,
    data_points: vector<DataPoint>,
): DataPackage {
    DataPackage {
        signer_address,
        timestamp,
        data_points,
    }
}

public fun new_data_point(feed_id: vector<u8>, value: vector<u8>): DataPoint {
    DataPoint {
        feed_id,
        value,
    }
}

public fun get_timestamp(data_package: &DataPackage): u64 {
    data_package.timestamp
}

public fun get_signer_address(data_package: &DataPackage): vector<u8> {
    data_package.signer_address
}

public fun get_data_points(data_package: &DataPackage): vector<DataPoint> {
    data_package.data_points
}

public fun get_feed_id(data_point: &DataPoint): vector<u8> {
    data_point.feed_id
}

public fun get_value(data_point: &DataPoint): vector<u8> {
    data_point.value
}
