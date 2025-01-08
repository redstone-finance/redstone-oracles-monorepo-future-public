// === Imports ===

module redstone_price_adapter::price_adapter;

use redstone_price_adapter::admin::AdminCap;
use redstone_price_adapter::price_data::{Self, PriceData};
use redstone_price_adapter::redstone_sdk_config::{Self, Config};
use redstone_price_adapter::redstone_sdk_payload::process_payload;
use redstone_price_adapter::redstone_sdk_update_check::assert_update_time;
use sui::clock::Clock;
use sui::event;
use sui::table::{Self, Table};

// === Errors ===

const E_INVALID_VERSION: u64 = 0;
const E_TIMESTAMP_STALE: u64 = 1;
const E_INVALID_FEED_ID: u64 = 2;

// === Constants ===

const VERSION: u8 = 1;

// === Structs ===

public struct AssertVersion has drop {}

public struct PriceAdapter has key {
    id: UID,
    prices: Table<vector<u8>, PriceData>,
    config: Config,
    version: u8,
}

public struct PriceWrite has copy, drop {
    feed_id: std::string::String,
    value: u256,
    timestamp: u64,
    write_timestamp: u64,
}

// === Public-Mutative Functions ===

public fun write_price(
    price_adapter: &mut PriceAdapter,
    feed_id: vector<u8>,
    payload: vector<u8>,
    clock: &Clock,
    tx_context: &TxContext,
): u256 {
    let timestamp_now_ms = clock.timestamp_ms();

    let assert_version = assert_version(price_adapter);

    let price_write_timestamp = price_adapter.get_price_feed_write_timestamp(
        feed_id,
    );

    // If the feed_id was written to before check condition
    price_write_timestamp.do!(|write_time| {
        assert_update_time(
            &price_adapter.config,
            write_time,
            timestamp_now_ms,
            tx_context.sender(),
        )
    });

    write_price_checked(
        assert_version,
        price_adapter,
        feed_id,
        payload,
        timestamp_now_ms,
    )
}

// === Public-View Functions ===

public fun price_and_timestamp(price_adapter: &PriceAdapter, feed_id: vector<u8>): (u256, u64) {
    price_adapter.price_data(feed_id).price_and_timestamp()
}

public fun price(price_adapter: &PriceAdapter, feed_id: vector<u8>): u256 {
    price_adapter.price_data(feed_id).price()
}

public fun timestamp(price_adapter: &PriceAdapter, feed_id: vector<u8>): u64 {
    price_adapter.price_data(feed_id).timestamp()
}

public fun price_data(price_adapter: &PriceAdapter, feed_id: vector<u8>): &PriceData {
    if (!price_adapter.prices.contains(feed_id)) {
        abort E_INVALID_FEED_ID
    };

    &price_adapter.prices[feed_id]
}

// === Admin Functions ===

public fun update_config(
    admin_cap: &AdminCap,
    priceAdapter: &mut PriceAdapter,
    signers: Option<vector<vector<u8>>>,
    signer_count_threshold: Option<u8>,
    max_timestamp_delay_ms: Option<u64>,
    max_timestamp_ahead_ms: Option<u64>,
    trusted_updaters: Option<vector<address>>,
    min_interval_between_updates_ms: Option<u64>,
) {
    let assert_version = assert_version(priceAdapter);

    update_config_checked(
        assert_version,
        admin_cap,
        priceAdapter,
        signers,
        signer_count_threshold,
        max_timestamp_delay_ms,
        max_timestamp_ahead_ms,
        trusted_updaters,
        min_interval_between_updates_ms,
    )
}

// === Public-Package Functions ===

public(package) fun new(
    _: &AdminCap,
    signers: vector<vector<u8>>,
    signer_count_threshold: u8,
    max_timestamp_delay_ms: u64,
    max_timestamp_ahead_ms: u64,
    trusted_updaters: vector<address>,
    min_interval_between_updates_ms: u64,
    ctx: &mut TxContext,
) {
    let config = redstone_sdk_config::new(
        signer_count_threshold,
        signers,
        max_timestamp_delay_ms,
        max_timestamp_ahead_ms,
        trusted_updaters,
        min_interval_between_updates_ms,
    );

    let price_adapter = PriceAdapter {
        id: object::new(ctx),
        prices: table::new(ctx),
        config,
        version: VERSION,
    };

    transfer::share_object(price_adapter);
}

/// Sets version for the PriceAdapter object. Can be called only by admin.
public(package) fun set_version(_: &AdminCap, price_adapter: &mut PriceAdapter, new_version: u8) {
    price_adapter.version = new_version;
}

// === Private Functions ===

fun write_price_checked(
    assert_version: AssertVersion,
    price_adapter: &mut PriceAdapter,
    feed_id: vector<u8>,
    payload: vector<u8>,
    timestamp_now_ms: u64,
): u256 {
    let (aggregated_value, timestamp) = process_payload(
        &price_adapter.config,
        timestamp_now_ms,
        feed_id,
        payload,
    );

    overwrite_price(
        assert_version,
        price_adapter,
        feed_id,
        aggregated_value,
        timestamp,
        timestamp_now_ms,
    );

    aggregated_value
}

fun get_or_create_default(
    _: AssertVersion,
    price_adapter: &mut PriceAdapter,
    feed_id: vector<u8>,
): &mut PriceData {
    if (!price_adapter.prices.contains(feed_id)) {
        let new_price_data = price_data::default(feed_id);
        price_adapter.prices.add(feed_id, new_price_data);
    };

    &mut price_adapter.prices[feed_id]
}

fun get_price_feed_write_timestamp(price_adapter: &PriceAdapter, feed_id: vector<u8>): Option<u64> {
    if (!price_adapter.prices.contains(feed_id)) {
        return option::none()
    };

    option::some(price_adapter.prices[feed_id].write_timestamp())
}

fun overwrite_price(
    assert_version: AssertVersion,
    price_adapter: &mut PriceAdapter,
    feed_id: vector<u8>,
    aggregated_value: u256,
    timestamp: u64,
    write_timestamp: u64,
) {
    let price_data = get_or_create_default(assert_version, price_adapter, feed_id);

    assert!(timestamp > price_data.timestamp(), E_TIMESTAMP_STALE);
    price_data.update(feed_id, aggregated_value, timestamp, write_timestamp);

    event::emit(PriceWrite {
        feed_id: std::string::utf8(feed_id),
        value: aggregated_value,
        timestamp,
        write_timestamp,
    });
}

fun update_config_checked(
    _: AssertVersion,
    admin_cap: &AdminCap,
    price_adapter: &mut PriceAdapter,
    mut signers: Option<vector<vector<u8>>>,
    mut signer_count_threshold: Option<u8>,
    mut max_timestamp_delay_ms: Option<u64>,
    mut max_timestamp_ahead_ms: Option<u64>,
    mut trusted_updaters: Option<vector<address>>,
    mut min_interval_between_updates_ms: Option<u64>,
) {
    // Extract new values or use existing ones
    let final_signers = if (signers.is_some()) {
        signers.extract()
    } else {
        price_adapter.config.signers()
    };

    let final_signer_count_threshold = if (signer_count_threshold.is_some()) {
        signer_count_threshold.extract()
    } else {
        price_adapter.config.signer_count_threshold()
    };

    let final_max_timestamp_delay_ms = if (max_timestamp_delay_ms.is_some()) {
        max_timestamp_delay_ms.extract()
    } else {
        price_adapter.config.max_timestamp_delay_ms()
    };

    let final_max_timestamp_ahead_ms = if (max_timestamp_ahead_ms.is_some()) {
        max_timestamp_ahead_ms.extract()
    } else {
        price_adapter.config.max_timestamp_ahead_ms()
    };

    let trusted_updaters = if (trusted_updaters.is_some()) {
        trusted_updaters.extract()
    } else {
        price_adapter.config.trusted_updaters()
    };

    let min_interval_between_updates_ms = if (min_interval_between_updates_ms.is_some()) {
        min_interval_between_updates_ms.extract()
    } else {
        price_adapter.config.min_interval_between_updates_ms()
    };

    // Create new config with all final values
    price_adapter
        .config
        .update_config(
            admin_cap,
            final_signers,
            final_signer_count_threshold,
            final_max_timestamp_delay_ms,
            final_max_timestamp_ahead_ms,
            trusted_updaters,
            min_interval_between_updates_ms,
        );
}

fun assert_version(price_adapter: &PriceAdapter): AssertVersion {
    assert!(price_adapter.version == VERSION, E_INVALID_VERSION);

    AssertVersion {}
}
