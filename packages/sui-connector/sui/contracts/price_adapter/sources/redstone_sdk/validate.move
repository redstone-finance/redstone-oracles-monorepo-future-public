// ==== Imports ===

module redstone_price_adapter::redstone_sdk_validate;

use redstone_price_adapter::redstone_sdk_config::{
    Config,
    signer_count_threshold,
    signers,
    max_timestamp_ahead_ms,
    max_timestamp_delay_ms
};
use redstone_price_adapter::redstone_sdk_data_package::{
    DataPackage,
    signer_address,
    timestamp
};

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
    assert!(vector::length(data_packages) > 0, E_EMPTY_DATA_PACKAGES);

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
    assert!(vector::length(bytes) >= REDSTONE_MARKER_LEN, E_INVALID_REDSTONE_MARKER);
    let marker = REDSTONE_MARKER;
    let mut i = vector::length(bytes) - REDSTONE_MARKER_LEN;
    while (i < vector::length(bytes)) {
        assert!(
            *vector::borrow(bytes, i) == *vector::borrow(
                    &marker,
                    i - (
                        vector::length(bytes) - REDSTONE_MARKER_LEN
                    )
                ),
            E_INVALID_REDSTONE_MARKER,
        );
        i = i + 1;
    };
}

// === Private Functions ===

fun verify_timestamps_are_the_same(data_packages: &vector<DataPackage>) {
    let mut i = 0;
    let timestamp = timestamp(&data_packages[0]);
    while (i < vector::length(data_packages)) {
        let package = vector::borrow(data_packages, i);
        assert!(timestamp(package) == timestamp, E_TIMESTAMP_MISMATCH);
        i = i + 1;
    };
}

fun verify_timestamp(package_timestamp: u64, config: &Config, current_timestamp: u64) {
    assert!(
        package_timestamp + max_timestamp_delay_ms(config) >= current_timestamp,
        E_TIMESTAMP_TOO_OLD,
    );
    assert!(
        package_timestamp <= current_timestamp + max_timestamp_ahead_ms(config),
        E_TIMESTAMP_TOO_FUTURE,
    );
}

fun verify_signer_count(
    data_packages: &vector<DataPackage>,
    threshold: u8,
    signers: &vector<vector<u8>>,
) {
    let mut count = 0;
    let mut i = 0;
    let mut remaining_signers = *signers; // Clone the signers vector

    while (i < vector::length(data_packages)) {
        let package = vector::borrow(data_packages, i);
        let mut j = 0;
        let len = vector::length(&remaining_signers);

        while (j < len) {
            if (signer_address(package) == *vector::borrow(&remaining_signers, j)) {
                vector::swap_remove(&mut remaining_signers, j); // Remove the used signer
                count = count + 1;
                break
            };
            j = j + 1;
        };

        if (count >= threshold) {
            return
        };
        i = i + 1;
    };
    assert!(false, E_INSUFFICIENT_SIGNER_COUNT);
}
