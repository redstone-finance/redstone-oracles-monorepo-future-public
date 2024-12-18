module redstone_price_adapter::main;

use redstone_price_adapter::admin::AdminCap;
use redstone_price_adapter::price_adapter;

public fun initialize_price_adapter(
    admin_cap: &AdminCap,
    signers: vector<vector<u8>>,
    signer_count_threshold: u8,
    max_timestamp_delay_ms: u64,
    max_timestamp_ahead_ms: u64,
    ctx: &mut TxContext,
) {
    price_adapter::new(
        admin_cap,
        signers,
        signer_count_threshold,
        max_timestamp_delay_ms,
        max_timestamp_ahead_ms,
        ctx,
    );
}
