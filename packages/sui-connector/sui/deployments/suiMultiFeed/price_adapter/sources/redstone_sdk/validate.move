// ==== Imports ===

module redstone_price_adapter::redstone_sdk_validate;

use redstone_price_adapter::redstone_sdk_config::{
    Config,
    signer_count_threshold,
    signers,
    max_timestamp_ahead_ms,
    max_timestamp_delay_ms
};
use redstone_price_adapter::redstone_sdk_data_package::{DataPackage, signer_address, timestamp};
use sui::vec_set;

// === Errors ===

const E_INVALID_REDSTONE_MARKER: u64 = 0;
const E_TIMESTAMP_TOO_OLD: u64 = 1;
const E_TIMESTAMP_TOO_FUTURE: u64 = 2;
const E_INSUFFICIENT_SIGNER_COUNT: u64 = 3;
const E_TIMESTAMP_MISMATCH: u64 = 4;
const E_EMPTY_DATA_PACKAGES: u64 = 5;

// === Constants ===

const REDSTONE_MARKER: vector<u8> = x"000002ed57011e0000";
const REDSTONE_MARKER_LEN: u64 = 9;

// === Public Functions ===

public fun verify_data_packages(
    data_packages: &vector<DataPackage>,
    config: &Config,
    current_timestamp: u64,
) {
    verify_timestamps_are_the_same(data_packages);

    // verify that packages timestamp is not stale
    verify_timestamp(
        timestamp(&data_packages[0]),
        config,
        current_timestamp,
    );

    verify_signer_count(
        data_packages,
        signer_count_threshold(config),
        &signers(config),
    );
}

public fun verify_redstone_marker(bytes: &vector<u8>) {
    let bytes_len = bytes.length();
    assert!(bytes_len >= REDSTONE_MARKER_LEN, E_INVALID_REDSTONE_MARKER);

    let marker = REDSTONE_MARKER;
    // for i in (bytes_len - REDSTONE_MARKER_LEN)..bytes_len
    (bytes_len - REDSTONE_MARKER_LEN).range_do!(bytes_len, |i| {
        assert!(bytes[i] == marker[i + REDSTONE_MARKER_LEN - bytes_len], E_INVALID_REDSTONE_MARKER);
    });
}

// === Private Functions ===

fun verify_timestamps_are_the_same(data_packages: &vector<DataPackage>) {
    assert!(!data_packages.is_empty(), E_EMPTY_DATA_PACKAGES);

    let timestamp = data_packages[0].timestamp();

    assert!(data_packages.all!(|package| package.timestamp() == timestamp), E_TIMESTAMP_MISMATCH);
}

fun verify_timestamp(package_timestamp: u64, config: &Config, current_timestamp: u64) {
    assert!(
        package_timestamp + config.max_timestamp_delay_ms() >= current_timestamp,
        E_TIMESTAMP_TOO_OLD,
    );
    assert!(
        package_timestamp <= current_timestamp + config.max_timestamp_ahead_ms(),
        E_TIMESTAMP_TOO_FUTURE,
    );
}

fun verify_signer_count(
    data_packages: &vector<DataPackage>,
    threshold: u8,
    signers: &vector<vector<u8>>,
) {
    let mut count = 0;
    // this will fail if signers not unique
    let mut signers = vec_set::from_keys(*signers);
    data_packages.do_ref!(|package| {
        let address = package.signer_address();

        if (signers.contains(address)) {
            count = count + 1;
            signers.remove(address);
        };

        if (count >= threshold) {
            return
        };
    });
    assert!(count >= threshold, E_INSUFFICIENT_SIGNER_COUNT);
}

// === Tests Functions ===

#[test_only]
use redstone_price_adapter::redstone_sdk_config::test_config;
#[test_only]
use redstone_price_adapter::redstone_sdk_data_package::new_data_package;

#[test]
fun test_verify_timestamps_are_the_same() {
    let data_packages = vector::tabulate!(10, |_| {
        new_data_package(x"", 10, vector[])
    });

    verify_timestamps_are_the_same(&data_packages);
}

#[test]
#[expected_failure(abort_code = E_TIMESTAMP_MISMATCH)]
fun test_verify_timestamps_are_the_same_different_timestamps() {
    let data_packages = vector::tabulate!(10, |i| {
        new_data_package(x"", i, vector[])
    });

    verify_timestamps_are_the_same(&data_packages);
}

#[test]
#[expected_failure(abort_code = E_EMPTY_DATA_PACKAGES)]
fun test_verify_timestamps_are_the_same_empty() {
    verify_timestamps_are_the_same(&vector[]);
}

#[test]
fun test_verify_timestamp() {
    let config = test_config();
    let current = 1_000;

    vector[0, 10, 200, 500].do!(|i| {
        verify_timestamp(current - i, &config, current);
        verify_timestamp(current + i, &config, current);
    });
}

#[test]
#[expected_failure(abort_code = E_TIMESTAMP_TOO_FUTURE)]
fun test_verify_timestamp_too_future() {
    let config = test_config();

    verify_timestamp(1000 + config.max_timestamp_ahead_ms() + 1, &config, 1000);
}

#[test]
#[expected_failure(abort_code = E_TIMESTAMP_TOO_OLD)]
fun test_verify_timestamp_too_old() {
    let config = test_config();
    let value = 1_000_000;

    verify_timestamp(value - config.max_timestamp_delay_ms() - 1, &config, value);
}

#[test]
fun test_verify_signer_count() {
    let data_packages = vector[
        new_data_package(x"00", 10, vector[]),
        new_data_package(x"01", 10, vector[]),
        new_data_package(x"02", 10, vector[]),
        new_data_package(x"03", 10, vector[]),
        new_data_package(x"04", 10, vector[]),
    ];

    let signers = vector[x"00", x"01", x"02", x"03"];

    4_u64.do_eq!(|threshold| verify_signer_count(&data_packages, threshold as u8, &signers));
}

#[test]
fun test_verify_signer_count_success() {
    let data_packages = vector[
        new_data_package(x"00", 10, vector[]),
        new_data_package(x"01", 10, vector[]),
        new_data_package(x"02", 10, vector[]),
        new_data_package(x"03", 10, vector[]),
        new_data_package(x"04", 10, vector[]),
    ];

    let signers = vector[x"00", x"01"];

    2_u64.do_eq!(|threshold| verify_signer_count(&data_packages, threshold as u8, &signers));
}

#[test]
#[expected_failure(abort_code = E_INSUFFICIENT_SIGNER_COUNT)]
fun test_verify_signer_count_fail() {
    let data_packages = vector[
        new_data_package(x"00", 10, vector[]),
        new_data_package(x"01", 10, vector[]),
        new_data_package(x"02", 10, vector[]),
        new_data_package(x"03", 10, vector[]),
        new_data_package(x"04", 10, vector[]),
    ];

    let signers = vector[x"00", x"01", x"02", x"03"];

    verify_signer_count(&data_packages, 5, &signers)
}

#[test]
#[expected_failure(abort_code = E_INSUFFICIENT_SIGNER_COUNT)]
fun test_verify_signer_count_unknow_signers() {
    let data_packages = vector[
        new_data_package(x"00", 10, vector[]),
        new_data_package(x"01", 10, vector[]),
        new_data_package(x"02", 10, vector[]),
        new_data_package(x"03", 10, vector[]),
        new_data_package(x"04", 10, vector[]),
    ];

    let signers = vector[x"11", x"12", x"13", x"14"];

    verify_signer_count(&data_packages, 3, &signers)
}

#[test]
#[expected_failure(abort_code = E_INVALID_REDSTONE_MARKER)]
fun test_verify_redstone_marker_bad_last_byte() {
    verify_redstone_marker(&x"000002ed57011e0001");
}

#[test]
#[expected_failure(abort_code = E_INVALID_REDSTONE_MARKER)]
fun test_verify_redstone_marker_bad_first_byte() {
    verify_redstone_marker(&x"100002ed57011e0000");
}

#[test]
#[expected_failure(abort_code = E_INVALID_REDSTONE_MARKER)]
fun test_verify_redstone_marker_bad_marker() {
    verify_redstone_marker(&vector::tabulate!(9, |i| i as u8));
}

#[test]
fun test_verify_redstone_marker() {
    let correct_marker = REDSTONE_MARKER;
    verify_redstone_marker(&correct_marker);
}

#[test]
fun test_verify_data_packages() {
    let config = test_config();
    let timestamp = 1000;

    let data_packages = vector[
        new_data_package(config.signers()[0], timestamp, vector[]),
        new_data_package(config.signers()[0], timestamp, vector[]),
        new_data_package(config.signers()[1], timestamp, vector[]),
        new_data_package(config.signers()[1], timestamp, vector[]),
        new_data_package(config.signers()[1], timestamp, vector[]),
    ];

    verify_data_packages(&data_packages, &config, 1000)
}
