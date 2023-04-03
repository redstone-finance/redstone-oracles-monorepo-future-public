from starkware.cairo.common.math import unsigned_div_rem

from redstone.utils.array import Array

struct Config {
    block_ts: felt,
    allowed_signer_addresses: Array,
    requested_feed_ids: Array,
    signer_count_threshold: felt,
}

func get_config_index(config: Config, price_index: felt, signer_index: felt) -> felt {
    return config.allowed_signer_addresses.len * price_index + signer_index;
}

func get_price_and_signer_indices{range_check_ptr}(config: Config, index: felt) -> (
    price_index: felt, signer_index: felt
) {
    let (price_index, signer_index) = unsigned_div_rem(index, config.allowed_signer_addresses.len);

    return (price_index=price_index, signer_index=signer_index);
}

func get_config_len(config: Config) -> felt {
    return config.allowed_signer_addresses.len * config.requested_feed_ids.len;
}
