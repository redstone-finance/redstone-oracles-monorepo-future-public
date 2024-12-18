module redstone_price_adapter::redstone_sdk_config;

use redstone_price_adapter::admin::AdminCap;

public struct Config has store, copy, drop {
    signer_count_threshold: u8,
    signers: vector<vector<u8>>,
    max_timestamp_delay_ms: u64,
    max_timestamp_ahead_ms: u64,
}

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

public fun get_signer_count_threshold(config: &Config): u8 {
    config.signer_count_threshold
}

public fun get_signers(config: &Config): vector<vector<u8>> {
    config.signers
}

public fun get_max_timestamp_delay_ms(config: &Config): u64 {
    config.max_timestamp_delay_ms
}

public fun get_max_timestamp_ahead_ms(config: &Config): u64 {
    config.max_timestamp_ahead_ms
}
