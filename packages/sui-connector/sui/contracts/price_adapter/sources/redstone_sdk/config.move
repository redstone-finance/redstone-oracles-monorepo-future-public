// === Imports ===

module redstone_price_adapter::redstone_sdk_config;

use redstone_price_adapter::admin::AdminCap;

// === Structs ===

public struct Config has store, copy, drop {
    signer_count_threshold: u8,
    signers: vector<vector<u8>>,
    max_timestamp_delay_ms: u64,
    max_timestamp_ahead_ms: u64,
}

// === Public-View Functions ===

public fun signer_count_threshold(config: &Config): u8 {
    config.signer_count_threshold
}

public fun signers(config: &Config): vector<vector<u8>> {
    config.signers
}

public fun max_timestamp_delay_ms(config: &Config): u64 {
    config.max_timestamp_delay_ms
}

public fun max_timestamp_ahead_ms(config: &Config): u64 {
    config.max_timestamp_ahead_ms
}

// === Public-Package Functions ===

public(package) fun new(
    signer_count_threshold: u8,
    signers: vector<vector<u8>>,
    max_timestamp_delay_ms: u64,
    max_timestamp_ahead_ms: u64,
): Config {
    Config {
        signer_count_threshold,
        signers,
        max_timestamp_delay_ms,
        max_timestamp_ahead_ms,
    }
}

public(package) fun update_config(
    config: &mut Config,
    _: &AdminCap,
    signers: vector<vector<u8>>,
    signer_count_threshold: u8,
    max_timestamp_delay_ms: u64,
    max_timestamp_ahead_ms: u64,
) {
    config.signers = signers;
    config.signer_count_threshold = signer_count_threshold;
    config.max_timestamp_delay_ms = max_timestamp_delay_ms;
    config.max_timestamp_ahead_ms = max_timestamp_ahead_ms;
}

// === Tests Functions ===

#[test_only]
public fun test_config(): Config {
    new(
        2,
        vector[
            x"1ea62d73edF8ac05dfcea1a34b9796e937a29eFF",
            x"109b4a318a4f5ddcbca6349b45f881b4137deafb",
        ],
        15 * 60 * 1000,
        3 * 60 * 1000,
    )
}
