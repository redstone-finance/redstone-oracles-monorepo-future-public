// === Imports ===

module redstone_price_adapter::redstone_sdk_config;

use redstone_price_adapter::admin::AdminCap;
use sui::vec_set;

// === Errors ===
const E_INVALID_SIGNER_COUNT_THRESHOLD: u64 = 0;
const E_SIGNER_COUNT_THRESHOLD_CANT_BE_ZERO: u64 = 0;

// === Structs ===

public struct Config has copy, drop, store {
    signer_count_threshold: u8,
    signers: vector<vector<u8>>,
    max_timestamp_delay_ms: u64,
    max_timestamp_ahead_ms: u64,
    trusted_updaters: vector<address>,
    min_interval_between_updates_ms: u64,
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

public fun trusted_updaters(config: &Config): vector<address> {
    config.trusted_updaters
}

public fun min_interval_between_updates_ms(config: &Config): u64 {
    config.min_interval_between_updates_ms
}

// === Public-Package Functions ===

public(package) fun new(
    signer_count_threshold: u8,
    signers: vector<vector<u8>>,
    max_timestamp_delay_ms: u64,
    max_timestamp_ahead_ms: u64,
    trusted_updaters: vector<address>,
    min_interval_between_updates_ms: u64,
): Config {
    let config = Config {
        signer_count_threshold,
        signers,
        max_timestamp_delay_ms,
        max_timestamp_ahead_ms,
        trusted_updaters,
        min_interval_between_updates_ms,
    };

    config.check();

    config
}

public(package) fun update_config(
    config: &mut Config,
    _: &AdminCap,
    signers: vector<vector<u8>>,
    signer_count_threshold: u8,
    max_timestamp_delay_ms: u64,
    max_timestamp_ahead_ms: u64,
    trusted_updaters: vector<address>,
    min_interval_between_updates_ms: u64,
) {
    config.signers = signers;
    config.signer_count_threshold = signer_count_threshold;
    config.max_timestamp_delay_ms = max_timestamp_delay_ms;
    config.max_timestamp_ahead_ms = max_timestamp_ahead_ms;
    config.trusted_updaters = trusted_updaters;
    config.min_interval_between_updates_ms = min_interval_between_updates_ms;

    config.check()
}

// === Private Functions ===
fun check(config: &Config) {
    // Check for unique signers, vec_set::from_keys fails if final_signers are not unique.
    let _ = vec_set::from_keys(config.signers);
    let signers_count = config.signers.length();

    assert!(
        signers_count >= (config.signer_count_threshold as u64),
        E_INVALID_SIGNER_COUNT_THRESHOLD,
    );
    assert!(signers_count > 0, E_SIGNER_COUNT_THRESHOLD_CANT_BE_ZERO);
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
        vector[],
        0,
    )
}
