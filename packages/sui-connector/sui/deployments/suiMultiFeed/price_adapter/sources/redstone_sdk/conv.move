// === Imports ===

module redstone_price_adapter::redstone_sdk_conv;

// === Public Functions ===

public fun from_bytes_to_u64(bytes: &vector<u8>): u64 {
    let mut result = 0u64;

    bytes.do_ref!(|byte| result = (result << 8)|(*byte as u64));

    result
}

public fun from_bytes_to_u256(bytes: &vector<u8>): u256 {
    let mut result = 0u256;

    bytes.do_ref!(|byte| result = (result << 8)|(*byte as u256));

    result
}

// === Test Functions ===

#[test_only]
fun test_u64(bytes: &vector<u8>, expected_number: u64) {
    let out = from_bytes_to_u64(bytes);

    assert!(out == expected_number, out);
}

#[test]
fun test_from_bytes_to_u64() {
    let inputs: vector<vector<u8>> = vector[
        vector[0],
        vector[1, 0],
        vector[1, 1],
        vector[0, 1, 0],
        vector[1, 1, 0],
        vector[1, 1, 1],
        vector[0, 0, 0, 0, 0],
    ];
    let expected_numbers = vector[0, 256, 256 + 1, 256, 256 * 256 + 256, 256 * 256 + 256 + 1, 0];

    inputs.zip_do_ref!(
        &expected_numbers,
        |bytes, expected_number| test_u64(bytes, *expected_number),
    );
}
#[test_only]
fun test_u256(bytes: &vector<u8>, expected_number: u256) {
    let out = from_bytes_to_u256(bytes);

    assert!(out == expected_number, out as u64);
}

#[test]
fun test_from_bytes_to_u256() {
    let inputs: vector<vector<u8>> = vector[
        vector[0],
        vector[1, 0],
        vector[1, 1],
        vector[0, 1, 0],
        vector[1, 1, 0],
        vector[1, 1, 1],
        vector[0, 0, 0, 0, 0],
    ];
    let expected_numbers: vector<u256> = vector[
        0,
        256,
        256 + 1,
        256,
        256 * 256 + 256,
        256 * 256 + 256 + 1,
        0,
    ];

    inputs.zip_do_ref!(
        &expected_numbers,
        |bytes, expected_number| test_u256(bytes, *expected_number),
    );
}
