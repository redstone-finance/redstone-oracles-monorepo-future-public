module redstone_price_adapter::price_adapter;

use redstone_price_adapter::admin::AdminCap;
use redstone_price_adapter::price_data::{Self, PriceData};
use redstone_price_adapter::redstone_sdk_config::{Self, Config};
use redstone_price_adapter::redstone_sdk_payload::process_payload;
use sui::clock::Clock;
use sui::event;
use sui::table::{Self, Table};

const E_TIMESTAMP_STALE: u64 = 0;
const E_INVALID_FEED_ID: u64 = 1;
const E_INVALID_SIGNER_COUNT: u64 = 2;
const E_INVALID_VERSION: u64 = 3;
const E_DUPLICATE_SIGNER: u64 = 4;

const VERSION: u8 = 1;

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

public(package) fun new(
    _: &AdminCap,
    signers: vector<vector<u8>>,
    signer_count_threshold: u8,
    max_timestamp_delay_ms: u64,
    max_timestamp_ahead_ms: u64,
    ctx: &mut TxContext,
) {
    let config = redstone_sdk_config::new(
        signer_count_threshold,
        signers,
        max_timestamp_delay_ms,
        max_timestamp_ahead_ms,
    );

    let price_adapter = PriceAdapter {
        id: object::new(ctx),
        prices: table::new(ctx),
        config,
        version: VERSION,
    };

    transfer::share_object(price_adapter);
}

public fun update_config(
    admin_cap: &AdminCap,
    priceAdapter: &mut PriceAdapter,
    signers: Option<vector<vector<u8>>>,
    signer_count_threshold: Option<u8>,
    max_timestamp_delay_ms: Option<u64>,
    max_timestamp_ahead_ms: Option<u64>,
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
    )
}

public fun read_price_and_timestamp(
    price_adapter: &PriceAdapter,
    feed_id: vector<u8>,
): (u256, u64) {
    let price_data = get_price_data(price_adapter, feed_id);

    price_data::read_price_and_timestamp(price_data)
}

public fun get_price_data(price_adapter: &PriceAdapter, feed_id: vector<u8>): &PriceData {
    if (!table::contains(&price_adapter.prices, feed_id)) {
        abort E_INVALID_FEED_ID
    };

    table::borrow(&price_adapter.prices, feed_id)
}

public fun write_price(
    price_adapter: &mut PriceAdapter,
    feed_id: vector<u8>,
    payload: vector<u8>,
    clock: &Clock,
): u256 {
    let assert_version = assert_version(price_adapter);

    write_price_checked(assert_version, price_adapter, feed_id, payload, clock)
}

fun write_price_checked(
    assert_version: AssertVersion,
    price_adapter: &mut PriceAdapter,
    feed_id: vector<u8>,
    payload: vector<u8>,
    clock: &Clock,
): u256 {
    let (aggregated_value, timestamp) = process_payload(
        &price_adapter.config,
        clock,
        feed_id,
        payload,
    );

    overwrite_price(
        assert_version,
        price_adapter,
        feed_id,
        aggregated_value,
        timestamp,
        clock.timestamp_ms(),
    );

    aggregated_value
}

fun overwrite_price(
    _: AssertVersion,
    price_adapter: &mut PriceAdapter,
    feed_id: vector<u8>,
    aggregated_value: u256,
    timestamp: u64,
    write_timestamp: u64,
) {
    if (!table::contains(&price_adapter.prices, feed_id)) {
        let new_price_data = price_data::default(feed_id);
        table::add(
            &mut price_adapter.prices,
            feed_id,
            new_price_data,
        );
    };

    let price_data = table::borrow_mut(&mut price_adapter.prices, feed_id);
    assert!(timestamp > price_data.timestamp(), E_TIMESTAMP_STALE);

    price_data.overwrite(feed_id, aggregated_value, timestamp, write_timestamp);

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
) {
    // Extract new values or use existing ones
    let final_signers = if (option::is_some(&signers)) {
        option::extract(&mut signers)
    } else {
        redstone_sdk_config::get_signers(&price_adapter.config)
    };

    let final_signer_count_threshold = if (option::is_some(&signer_count_threshold)) {
        option::extract(&mut signer_count_threshold)
    } else {
        redstone_sdk_config::get_signer_count_threshold(&price_adapter.config)
    };

    let final_max_timestamp_delay_ms = if (option::is_some(&max_timestamp_delay_ms)) {
        option::extract(&mut max_timestamp_delay_ms)
    } else {
        redstone_sdk_config::get_max_timestamp_delay_ms(&price_adapter.config)
    };

    let final_max_timestamp_ahead_ms = if (option::is_some(&max_timestamp_ahead_ms)) {
        option::extract(&mut max_timestamp_ahead_ms)
    } else {
        redstone_sdk_config::get_max_timestamp_ahead_ms(&price_adapter.config)
    };

    assert!(
        vector::length(&final_signers) >= (final_signer_count_threshold as u64),
        E_INVALID_SIGNER_COUNT,
    );

    // Check for unique signers
    let len = vector::length(&final_signers);
    let mut i = 0;
    while (i < len) {
        let mut j = i + 1;
        while (j < len) {
            assert!(
                vector::borrow(&final_signers, i) != vector::borrow(&final_signers, j),
                E_DUPLICATE_SIGNER,
            );
            j = j + 1;
        };
        i = i + 1;
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
        );
}

fun assert_version(price_adapter: &PriceAdapter): AssertVersion {
    assert!(price_adapter.version == VERSION, E_INVALID_VERSION);

    AssertVersion {}
}
