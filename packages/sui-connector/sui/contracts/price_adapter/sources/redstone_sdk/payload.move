module redstone_price_adapter::redstone_sdk_payload;

use redstone_price_adapter::redstone_sdk_config::Config;
use redstone_price_adapter::redstone_sdk_conv::{from_bytes_to_u64, from_bytes_to_u256};
use redstone_price_adapter::redstone_sdk_crypto::recover_address;
use redstone_price_adapter::redstone_sdk_data_package::{
    DataPackage,
    DataPoint,
    get_value,
    get_feed_id,
    get_data_points,
    new_data_point,
    new_data_package,
    get_timestamp
};
use redstone_price_adapter::redstone_sdk_median::calculate_median;
use redstone_price_adapter::redstone_sdk_validate::{verify_data_packages, verify_redstone_marker};
use sui::clock::Clock;

const UNSIGNED_METADATA_BYTE_SIZE_BS: u64 = 3;
const DATA_PACKAGES_COUNT_BS: u64 = 2;
const DATA_POINTS_COUNT_BS: u64 = 3;
const SIGNATURE_BS: u64 = 65;
const DATA_POINT_VALUE_BYTE_SIZE_BS: u64 = 4;
const DATA_FEED_ID_BS: u64 = 32;
const TIMESTAMP_BS: u64 = 6;
const REDSTONE_MARKER_BS: u64 = 9;

const E_DATA_INCONSISTENT: u64 = 0;

public struct Payload has copy, drop {
    data_packages: vector<DataPackage>,
}

public fun get_payload_package_timestamp(payload: &Payload): u64 {
    get_timestamp(&payload.data_packages[0])
}

public fun get_data_packages(payload: &Payload): vector<DataPackage> {
    payload.data_packages
}

public fun process_payload(
    config: &Config,
    clock: &Clock,
    feed_id: vector<u8>,
    payload: vector<u8>,
): (u256, u64) {
    let parsed_payload = parse_raw_payload(payload);
    let data_packages = filter_packages_by_feed_id(
        &get_data_packages(&parsed_payload),
        &feed_id,
    );

    verify_data_packages(
        &data_packages,
        config,
        clock.timestamp_ms(),
    );

    let values = extract_values_by_feed_id(&parsed_payload, &feed_id);
    let aggregated_value = calculate_median(
        &mut values.map!(|bytes| from_bytes_to_u256(&bytes)),
    );
    let new_package_timestamp = get_payload_package_timestamp(&parsed_payload);

    (aggregated_value, new_package_timestamp)
}

fun parse_raw_payload(mut payload: vector<u8>): Payload {
    verify_redstone_marker(&payload);
    trim_redstone_marker(&mut payload);

    let parsed_payload = trim_payload(&mut payload);

    parsed_payload
}

fun trim_redstone_marker(payload: &mut vector<u8>) {
    let mut i = 0;
    while (i < REDSTONE_MARKER_BS) {
        vector::pop_back(payload);
        i = i + 1;
    };
}

fun trim_payload(payload: &mut vector<u8>): Payload {
    let data_packages_count = trim_metadata(payload);
    let data_packages = trim_data_packages(payload, data_packages_count);
    assert!(vector::length(payload) == 0, E_DATA_INCONSISTENT);
    Payload { data_packages }
}

fun trim_metadata(payload: &mut vector<u8>): u64 {
    let unsigned_metadata_size = trim_end(
        payload,
        UNSIGNED_METADATA_BYTE_SIZE_BS,
    );
    let unsigned_metadata_size = from_bytes_to_u64(&unsigned_metadata_size);
    let _ = trim_end(payload, unsigned_metadata_size);
    let package_count = trim_end(payload, DATA_PACKAGES_COUNT_BS);

    from_bytes_to_u64(&package_count)
}

fun trim_data_packages(payload: &mut vector<u8>, count: u64): vector<DataPackage> {
    let mut data_packages = vector::empty();
    let mut i = 0;
    while (i < count) {
        let data_package = trim_data_package(payload);
        vector::push_back(&mut data_packages, data_package);
        i = i + 1;
    };
    data_packages
}

fun trim_data_package(payload: &mut vector<u8>): DataPackage {
    let signature = trim_end(payload, SIGNATURE_BS);
    let mut tmp = *payload;
    let data_point_count = trim_data_point_count(payload);
    let value_size = trim_data_point_value_size(payload);
    let timestamp = trim_timestamp(payload);
    let size =
        data_point_count * (value_size + DATA_FEED_ID_BS) + DATA_POINT_VALUE_BYTE_SIZE_BS
            + TIMESTAMP_BS + DATA_POINTS_COUNT_BS;
    let signable_bytes = trim_end(&mut tmp, size);
    let signer_address = recover_address(&signable_bytes, &signature);
    let data_points = parse_data_points(
        payload,
        data_point_count,
        value_size,
    );

    new_data_package(signer_address, timestamp, data_points)
}

fun trim_data_point_count(payload: &mut vector<u8>): u64 {
    let data_point_count = trim_end(payload, DATA_POINTS_COUNT_BS);
    from_bytes_to_u64(&data_point_count)
}

fun trim_data_point_value_size(payload: &mut vector<u8>): u64 {
    let value_size = trim_end(
        payload,
        DATA_POINT_VALUE_BYTE_SIZE_BS,
    );
    from_bytes_to_u64(&value_size)
}

fun trim_timestamp(payload: &mut vector<u8>): u64 {
    let timestamp = trim_end(payload, TIMESTAMP_BS);
    from_bytes_to_u64(&timestamp)
}

fun parse_data_points(payload: &mut vector<u8>, count: u64, value_size: u64): vector<DataPoint> {
    let mut data_points = vector::empty();
    let mut i = 0;
    while (i < count) {
        let data_point = parse_data_point(payload, value_size);
        vector::push_back(&mut data_points, data_point);
        i = i + 1;
    };
    data_points
}

fun parse_data_point(payload: &mut vector<u8>, value_size: u64): DataPoint {
    let value = trim_end(payload, value_size);
    let feed_id = trim_end(payload, DATA_FEED_ID_BS);
    new_data_point(feed_id, value)
}

fun filter_packages_by_feed_id(
    packages: &vector<DataPackage>,
    feed_id: &vector<u8>,
): vector<DataPackage> {
    let mut filtered_packages = vector::empty<DataPackage>();
    let mut i = 0;
    while (i < vector::length(packages)) {
        let package = vector::borrow(packages, i);
        let data_points = get_data_points(package);
        let mut j = 0;
        let mut should_include = false;

        // Check if any data point in the package contains the feed_id
        while (j < vector::length(&data_points)) {
            let data_point = vector::borrow(&data_points, j);
            if (get_feed_id(data_point) == feed_id) {
                should_include = true;
                break
            };
            j = j + 1;
        };

        if (should_include) {
            vector::push_back(&mut filtered_packages, *package);
        };

        i = i + 1;
    };

    filtered_packages
}

public fun extract_values_by_feed_id(
    payload: &Payload,
    feed_id: &vector<u8>,
): vector<vector<u8>> {
    let mut values = vector::empty<vector<u8>>();
    let mut i = 0;
    let data_packages = get_data_packages(payload);
    while (i < vector::length(&data_packages)) {
        let package = vector::borrow(&data_packages, i);
        let data_points = get_data_points(package);
        let mut j = 0;
        while (j < vector::length(&data_points)) {
            let data_point = vector::borrow(&data_points, j);
            if (get_feed_id(data_point) == feed_id) {
                vector::push_back(&mut values, get_value(data_point));
            };
            j = j + 1;
        };
        i = i + 1;
    };
    values
}

fun trim_end(v: &mut vector<u8>, len: u64): vector<u8> {
    let v_len = vector::length(v);
    if (len >= v_len) {
        // If len is greater than or equal to the vector length,
        // return the entire vector and leave the original empty
        let result = *v;
        *v = vector::empty();
        result
    } else {
        // Otherwise, split off the last 'len' elements
        let split_index = v_len - len;
        let mut result = vector::empty();
        while (vector::length(v) > split_index) {
            vector::push_back(&mut result, vector::pop_back(v));
        };
        vector::reverse(&mut result);
        result
    }
}
