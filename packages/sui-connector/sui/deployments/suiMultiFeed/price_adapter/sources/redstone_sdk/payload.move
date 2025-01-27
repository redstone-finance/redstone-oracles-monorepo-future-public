// === Imports ===

module redstone_price_adapter::redstone_sdk_payload;

use redstone_price_adapter::redstone_sdk_config::Config;
use redstone_price_adapter::redstone_sdk_conv::{from_bytes_to_u64, from_bytes_to_u256};
use redstone_price_adapter::redstone_sdk_crypto::recover_address;
use redstone_price_adapter::redstone_sdk_data_package::{
    DataPackage,
    DataPoint,
    value,
    feed_id,
    data_points,
    new_data_point,
    new_data_package,
    timestamp
};
use redstone_price_adapter::redstone_sdk_median::calculate_median;
use redstone_price_adapter::redstone_sdk_validate::{verify_data_packages, verify_redstone_marker};

// === Errors ===

const E_DATA_INCONSISTENT: u64 = 0;

// === Constants ===

const UNSIGNED_METADATA_BYTE_SIZE_BS: u64 = 3;
const DATA_PACKAGES_COUNT_BS: u64 = 2;
const DATA_POINTS_COUNT_BS: u64 = 3;
const SIGNATURE_BS: u64 = 65;
const DATA_POINT_VALUE_BYTE_SIZE_BS: u64 = 4;
const DATA_FEED_ID_BS: u64 = 32;
const TIMESTAMP_BS: u64 = 6;
const REDSTONE_MARKER_BS: u64 = 9;

// === Structs ===

public struct Payload has copy, drop {
    data_packages: vector<DataPackage>,
}

// === Public Functions ===

public fun process_payload(
    config: &Config,
    timestamp_now_ms: u64,
    feed_id: vector<u8>,
    payload: vector<u8>,
): (u256, u64) {
    let parsed_payload = parse_raw_payload(payload);
    let data_packages = filter_packages_by_feed_id(
        &data_packages(&parsed_payload),
        &feed_id,
    );

    verify_data_packages(
        &data_packages,
        config,
        timestamp_now_ms,
    );

    let values = extract_values_by_feed_id(&parsed_payload, &feed_id);
    let aggregated_value = calculate_median(
        &mut values.map!(|bytes| from_bytes_to_u256(&bytes)),
    );
    let new_package_timestamp = package_timestamp(&parsed_payload);

    (aggregated_value, new_package_timestamp)
}

// === Public-View Functions ===
public fun package_timestamp(payload: &Payload): u64 {
    timestamp(&payload.data_packages[0])
}

public fun extract_values_by_feed_id(payload: &Payload, feed_id: &vector<u8>): vector<vector<u8>> {
    payload
        .data_packages()
        .map!(|package| *package.data_points())
        .flatten()
        .filter!(|data_point| data_point.feed_id() == feed_id)
        .map!(|data_point| *data_point.value())
}

public fun data_packages(payload: &Payload): vector<DataPackage> {
    payload.data_packages
}

// === Private Functions ===

fun parse_raw_payload(mut payload: vector<u8>): Payload {
    verify_redstone_marker(&payload);
    trim_redstone_marker(&mut payload);

    let parsed_payload = trim_payload(&mut payload);

    parsed_payload
}

fun trim_redstone_marker(payload: &mut vector<u8>) {
    let mut i = 0;
    while (i < REDSTONE_MARKER_BS) {
        payload.pop_back();
        i = i + 1;
    };
}

fun trim_payload(payload: &mut vector<u8>): Payload {
    let data_packages_count = trim_metadata(payload);
    let data_packages = trim_data_packages(payload, data_packages_count);
    assert!(payload.is_empty(), E_DATA_INCONSISTENT);
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
    vector::tabulate!(count, |_| {
        trim_data_package(payload)
    })
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
    let data_points = trim_data_points(
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

fun trim_data_points(payload: &mut vector<u8>, count: u64, value_size: u64): vector<DataPoint> {
    vector::tabulate!(count, |_| {
        trim_data_point(payload, value_size)
    })
}

fun trim_data_point(payload: &mut vector<u8>, value_size: u64): DataPoint {
    let value = trim_end(payload, value_size);
    let feed_id = trim_end(payload, DATA_FEED_ID_BS);
    new_data_point(feed_id, value)
}

fun data_points_contains_feed_id(points: &vector<DataPoint>, feed_id: &vector<u8>): bool {
    points.any!(|point| point.feed_id() == feed_id)
}

fun filter_packages_by_feed_id(
    packages: &vector<DataPackage>,
    feed_id: &vector<u8>,
): vector<DataPackage> {
    let mut filtered_packages = vector::empty<DataPackage>();

    // for package in packages
    packages.do_ref!(|package| {
        if (data_points_contains_feed_id(package.data_points(), feed_id)) {
            filtered_packages.push_back(*package);
        }
    });

    filtered_packages
}

fun trim_end(v: &mut vector<u8>, len: u64): vector<u8> {
    let v_len = v.length();
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

        while (v.length() > split_index) {
            result.push_back(v.pop_back());
        };

        result.reverse();
        result
    }
}

// === Tests Functions ===

#[test_only]
use redstone_price_adapter::redstone_sdk_config::test_config;

#[test]
fun test_process_payload() {
    let payload = SAMPLE_PAYLOAD;
    let feed_id = x"4554480000000000000000000000000000000000000000000000000000000000";
    let timestamp = 1707307760000;

    let (val, timestamp) = process_payload(&test_config(), timestamp, feed_id, payload);

    assert!(val == 236389750361);
    assert!(timestamp == 1707307760000);
}

#[test]
fun test_make_payload() {
    let payload = parse_raw_payload(SAMPLE_PAYLOAD);

    assert!(payload.data_packages().length() == 15);
}

#[test]
fun test_trim_data_packages() {
    let mut data_package_bytes =
        x"4554480000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000360cafc94e018d79bf0ba00000002000000151afa8c5c3caf6004b42c0fb17723e524f993b9ecbad3b9bce5ec74930fa436a3660e8edef10e96ee5f222de7ef5787c02ca467c0ec18daa2907b43ac20c63c11c";
    let signer_address = x"1ea62d73edf8ac05dfcea1a34b9796e937a29eff";
    let value = x"000000000000000000000000000000000000000000000000000000360cafc94e"; // 232141080910
    let feed_id = x"4554480000000000000000000000000000000000000000000000000000000000";
    let timestamp = 1707144580000;

    let data_packages = trim_data_packages(&mut data_package_bytes, 1);

    assert!(data_package_bytes == vector::empty());
    assert!(data_packages.length() == 1);
    assert!(data_packages[0].data_points().length() == 1);
    assert!(data_packages[0].timestamp() == timestamp);
    assert!(data_packages[0].signer_address() == signer_address);
    test_data_point(data_packages[0].data_points()[0], feed_id, value);
}

#[test]
fun test_trim_data_points() {
    let mut data_bytes =
        x"4554480000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000360cafc94e";
    let value = x"000000000000000000000000000000000000000000000000000000360cafc94e"; // 232141080910
    let feed_id = x"4554480000000000000000000000000000000000000000000000000000000000";

    let data_points = trim_data_points(&mut data_bytes, 1, 32);

    assert!(data_points.length() == 1);
    test_data_point(data_points[0], feed_id, value);
}

#[test]
fun test_trim_data_point() {
    let mut data_bytes =
        x"4554480000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000360cafc94e";
    let value = x"000000000000000000000000000000000000000000000000000000360cafc94e"; // 232141080910
    let feed_id = x"4554480000000000000000000000000000000000000000000000000000000000";

    let data_point = trim_data_point(&mut data_bytes, 32);

    test_data_point(data_point, feed_id, value);
}

#[test]
fun test_trim_end() {
    let payload = x"000002ed57011e0000";
    let sizes_to_trim = vector[1000, 0, 1, 5];
    let expected_payloads = vector[x"", x"000002ed57011e0000", x"000002ed57011e00", x"000002ed"];
    let expected_trimmeds = vector[x"000002ed57011e0000", x"", x"00", x"57011e0000"];

    let testcases_count = sizes_to_trim.length();
    assert!(testcases_count == expected_payloads.length(), 101);
    assert!(testcases_count == expected_trimmeds.length(), 102);

    // for i in range 0..testcases_count
    0_u64.range_do!(
        testcases_count,
        |i| test_trim_end_tescase(
            payload,
            expected_payloads[i],
            expected_trimmeds[i],
            sizes_to_trim[i],
        ),
    );
}

#[test]
fun test_trim_redstone_marker() {
    let mut payload = x"000002ed57011e0000";
    trim_redstone_marker(&mut payload);

    assert!(payload == vector::empty());
}

#[test]
fun test_trim_metadata() {
    let prefix = x"9e0294371c";

    let payload_metadata_bytes = x"9e0294371c000f000000";
    let payload_metadata_with_unsigned_byte = x"9e0294371c000f55000001";
    let payload_metadata_with_unsigned_bytes =
        x"9e0294371c000f11223344556677889900aabbccddeeff000010";

    let payloads = vector[
        payload_metadata_bytes,
        payload_metadata_with_unsigned_byte,
        payload_metadata_with_unsigned_bytes,
    ];

    payloads.do!(|mut payload| {
        let metadata_count = trim_metadata(&mut payload);
        assert!(metadata_count == 15);
        assert!(payload == prefix);
    });
}

#[test]
fun test_filter_packages_by_feed_id() {
    let data_packages = vector[
        new_test_data_package(0, data_points_by_feed_id(x"11", 10)),
        new_test_data_package(1, data_points_by_feed_id(x"21", 10)),
        new_test_data_package(2, data_points_by_feed_id(x"31", 10)),
        new_test_data_package(3, data_points_by_feed_id(x"41", 10)),
        new_test_data_package(
            4,
            vector[
                new_data_point(x"11", x""),
                new_data_point(x"21", x""),
                new_data_point(x"31", x""),
                new_data_point(x"41", x""),
                new_data_point(x"51", x""),
            ],
        ),
    ];

    let filtered = filter_packages_by_feed_id(&data_packages, &x"11");

    // we use timestamp here as ids of packages for tests asserts :)
    assert!(filtered.length() == 2);
    assert!(filtered[0].timestamp() == 0);
    assert!(filtered[1].timestamp() == 4);

    let filtered = filter_packages_by_feed_id(&data_packages, &x"1123");

    assert!(filtered.length() == 0);

    let filtered = filter_packages_by_feed_id(&data_packages, &x"51");

    assert!(filtered.length() == 1);
    assert!(filtered[0].timestamp() == 4);
}

#[test_only]
const SAMPLE_PAYLOAD: vector<u8> =
    x"45544800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003709f35687018d8378f9800000002000000139c69986b10617291f07fe420bd9991de3aca4dd4c1a7e77f075aebbe56221a846649b1083773c945ae89c0074331037eba52b7f57dc634426099a7ec63f45711b45544800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003709f2ff20018d8378f980000000200000017dcdb6561923ebea544f9cd51aa32a1d37eba0960bfa9121cef9cdedd3135c88009e6c2e761492d14a4674ff3958a3f1c7b3e7c14b9bc08e107d8bab0a8f5a3d1c45544800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003709ed5659018d8378f980000000200000015687773e177cd39b410c06f25bd61e52abe8d8f8dffba822168eb06d9ac86fb947d83779cb9437f74e21359ed09568284da76d92351ee9a80df27ea4e6c8e5cc1b45544800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003709ebaa55018d8378f98000000020000001f321c0ca3703cad49fe373d98a4cceba1fad5172fdb0adb47877277328a869867d1d10c8e69e762cf6035983c0504423b2389bd24638c910c16467c4b9c4c4521b455448000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000037094b8cc2018d8378f98000000020000001c9fd2f5f1f01612a41c9337e3c1939050284dcc72b091cd4503d75913a38b7773d3bec57a07d95468b29c42504b2bec4546b655a33adbc062eeeeddf275986bb1c4254430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003e7316ea122018d8378f9800000002000000156588a1f87423c2675eb6f780b73649beb98ee062fb732ef1521e1b3e6ed366e7c584eab98215a7fb8b0cc136fde92f0f8f76fb49dd8534f44fbaab00b7a7be41b4254430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003e73180bb79018d8378f98000000020000001d14781f831df36e6529deb617d17887994092ac5ea7e0ea9c2f12ab84fc6a2952f48411f309aad4b16cc698a3c6dd60a5c998771fca4d08397d84948e6daff721c4254430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003e730b34178018d8378f980000000200000017f092d8108b516db8b163b382eb9d828848fe636bb433c8d0420e2451c6a960f5b1c224394b1cba681658c219b208fca2d06d90fa943e625772a3528c5d857d81c4254430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003e730580d76018d8378f9800000002000000159dda68806f9c64b9c93c2bb21d079cf3f1d07cae51da8173f9552fa2bcd3cf73758c0e46b1eecc46d12f1876cfbda3360cb1a25a11a38ef21c5f9e539c27c981b4254430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003e7318b8ad3018d8378f98000000020000001b4f2c86c5a1300c4f001a6878525afc23f9fe1aefbab7861439fd613f839d04a39caf6a037d4bb3996b90e98c2d2d850691eefe3f67e502f6278aa0a652c2e8a1b415641580000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000cbc887e2018d8378f980000000200000011001f8291b8b722e939f5aea0a436375d451d79ff5c1e248d2857f8fe341db007d8692a67c0bcf777f624c06da5b16ce30ec03b2fcbd301a3daec708eab215961c415641580000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000cbc8855a018d8378f980000000200000019ae0e0a4ceb48265b808e42ad2463984f6b4262dacbe34d6d085734177682d7474effb1cc22327b9f4ed31862c8d19868101b6dbed7f0d9579e22824cbe420421b415641580000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000cbc85b72018d8378f980000000200000017f05693fd3b0b4cae6c9c55507ae69a1682f63c2854215198400549777c7a4fa13d632296e7db0f24de80a4548bc9dfec8c4b82a954294f7cb8295e88006164b1b415641580000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000cbc84f11018d8378f98000000020000001722670ba61759fd47cb5eeceeda2c69695c2d3a633784af475d9a5c682d03f74250d4de708849ae0fc6eb6d043fa27be75357ace22aef071705d5f1bcbbac7f51b415641580000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000cbc8878f018d8378f98000000020000001d31cf023168e23772053a48dfbade05535bd2348d6a5e4b42516206037adbe715e8f272703763169a17b65073b88ab5a4201e514d8436f6e169114cf53c709521b000f000000000002ed57011e0000";

#[test_only]
fun test_trim_end_tescase(
    mut payload: vector<u8>,
    expected_payload: vector<u8>,
    expected_trimmed: vector<u8>,
    size_to_trim: u64,
) {
    let trimmed = trim_end(&mut payload, size_to_trim);

    assert!(trimmed == expected_trimmed);
    assert!(payload == expected_payload);
}

#[test_only]
fun data_points_by_feed_id(feed_id: vector<u8>, count: u64): vector<DataPoint> {
    vector::tabulate!(count, |_| new_data_point(feed_id, x""))
}

#[test_only]
fun new_test_data_package(timestamp: u64, data_points: vector<DataPoint>): DataPackage {
    new_data_package(
        x"",
        timestamp,
        data_points,
    )
}

#[test_only]
fun test_data_point(data_point: DataPoint, feed_id: vector<u8>, value: vector<u8>) {
    assert!(data_point.feed_id() == feed_id);
    assert!(data_point.value() == value);
}
