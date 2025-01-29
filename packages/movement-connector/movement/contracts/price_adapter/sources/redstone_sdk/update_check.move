module redstone_price_adapter::update_check {

    // === Imports ===
    use redstone_price_adapter::redstone_sdk_config::Config;
    use redstone_price_adapter::redstone_sdk_config::trusted_updaters;
    use redstone_price_adapter::redstone_sdk_config::min_interval_between_updates_ms;
    use std::vector;

    // === Errors ===

    const E_UPDATE_TOO_SOON: u64 = 0;

    // === Public-Friend Functions ===
    friend redstone_price_adapter::price_adapter;

    public(friend) fun assert_update_time(
        config: &Config,
        last_update_timestamp_ms: u64,
        timestamp_now_ms: u64,
        sender: address
    ) {
        if (sender_in_trusted(config, sender)) {
            assert!(timestamp_now_ms > last_update_timestamp_ms, E_UPDATE_TOO_SOON);
        } else {
            assert!(
                last_update_timestamp_ms + min_interval_between_updates_ms(config)
                    < timestamp_now_ms,
                E_UPDATE_TOO_SOON
            );
        };
    }

    // === Private Functions ===

    fun sender_in_trusted(config: &Config, sender: address): bool {
        let trusted_updaters = trusted_updaters(config);
        for (i in 0..vector::length(&trusted_updaters)) {
            if (sender == *vector::borrow(&trusted_updaters, i))
                return true;
        };
        false
    }
}
