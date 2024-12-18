// === Imports ===

module redstone_price_adapter::redstone_sdk_conv;

// === Public Functions ===

public fun from_bytes_to_u64(bytes: &vector<u8>): u64 {
    let mut result = 0u64;
    let mut i = 0;
    while (i < vector::length(bytes)) {
        result = (result << 8)|(*vector::borrow(bytes, i) as u64);
        i = i + 1;
    };
    result
}

public fun from_bytes_to_u256(bytes: &vector<u8>): u256 {
    let mut result = 0u256;
    let mut i = 0;
    while (i < vector::length(bytes)) {
        result = (result << 8)|(*vector::borrow(bytes, i) as u256);
        i = i + 1;
    };
    result
}
