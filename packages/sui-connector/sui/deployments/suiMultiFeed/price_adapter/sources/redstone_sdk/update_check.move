// === Imports ===

module redstone_price_adapter::redstone_sdk_update_check;

use redstone_price_adapter::redstone_sdk_config::Config;

// === Errors ===

const E_UPDATE_TOO_SOON: u64 = 0;

// === Public-Package Functions ===

public(package) fun assert_update_time(
    config: &Config,
    last_update_timestamp_ms: u64,
    timestamp_now_ms: u64,
    sender: address,
) {
    if (sender_in_trusted(config, sender)) {
        assert!(last_update_timestamp_ms < timestamp_now_ms, E_UPDATE_TOO_SOON);
    } else {
        assert!(
            last_update_timestamp_ms + config.min_interval_between_updates_ms() < timestamp_now_ms,
            E_UPDATE_TOO_SOON,
        );
    };
}

// === Private Functions ===

fun sender_in_trusted(config: &Config, sender: address): bool {
    config.trusted_updaters().any!(|trusted| trusted == sender)
}
