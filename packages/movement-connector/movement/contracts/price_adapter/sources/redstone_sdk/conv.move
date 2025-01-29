module redstone_price_adapter::redstone_sdk_conv {
    // === Imports ===
    use std::vector;

    // === Public Functions ===
    public fun from_bytes_to_u256(bytes: &vector<u8>): u256 {
        let len = vector::length(bytes);
        if (len == 0) return 0;
        let value = 0u256;
        let i = 0u64;
        while (i < 32) {
            let mask =
                if (32 - i > len) 0u256
                else (*vector::borrow(bytes, len - (32 - i)) as u256) << (
                    8 * (31 - i) as u8
                );
            value = value | mask;
            i = i + 1;
        };
        return value
    }

    public fun from_bytes_to_u64(bytes: &vector<u8>): u64 {
        let len = vector::length(bytes);
        if (len == 0) return 0;
        let value = 0u64;
        let i = 0u64;
        while (i < 8) {
            let mask =
                if (8 - i > len) 0u64
                else (*vector::borrow(bytes, len - (8 - i)) as u64) << (8 * (7 - i) as u8);
            value = value | mask;
            i = i + 1;
        };
        return value
    }

    // === Test Functions ===

    #[test_only]
    fun test_u64(bytes: &vector<u8>, expected_number: u64) {
        let out = from_bytes_to_u64(bytes);
        assert!(out == expected_number, out);
    }

    #[test_only]
    fun test_u256(bytes: &vector<u8>, expected_number: u256) {
        let out = from_bytes_to_u256(bytes);
        assert!(out == expected_number, 0);
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
            vector[1, 0, 0, 0, 0, 0, 0, 0],
            vector[1, 0, 0, 0, 0, 0, 0, 12],
            vector[1, 0, 0, 123, 0, 0, 0, 255]
        ];
        let expected_numbers = vector[
            0,
            256,
            256 + 1,
            256,
            256 * 256 + 256,
            256 * 256 + 256 + 1,
            0,
            256 * 256 * 256 * 256 * 256 * 256 * 256,
            256 * 256 * 256 * 256 * 256 * 256 * 256 + 12,
            256 * 256 * 256 * 256 * 256 * 256 * 256 + 123 * 256 * 256 * 256 * 256 + 255
        ];

        for (i in 0..vector::length(&inputs)) {
            test_u64(
                vector::borrow(&inputs, i),
                *vector::borrow(&expected_numbers, i)
            );
        };
    }

    #[test]
    fun test_from_bytes_to_u256() {
        let inputs: vector<vector<u8>> = vector[
            vector[0], vector[1, 0], vector[1, 1], vector[0, 1, 0], vector[1, 1, 0], vector[
            1, 1, 1], vector[0, 0, 0, 0, 0], vector[1, 0, 0, 0, 0, 0, 0, 0], vector[255, 0,
            0, 0, 0, 0, 0, 0], vector[20, 0, 0, 0, 0, 77, 0, 0], vector[1, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0], vector[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0,
            255, 123]
        ];
        let expected_numbers: vector<u256> = vector[
            0,
            256,
            256 + 1,
            256,
            256 * 256 + 256,
            256 * 256 + 256 + 1,
            0,
            256 * 256 * 256 * 256 * 256 * 256 * 256,
            255 * 256 * 256 * 256 * 256 * 256 * 256 * 256,
            20 * 256 * 256 * 256 * 256 * 256 * 256 * 256 + 77 * 256 * 256,
            256 * 256 * 256 * 256 * 256 * 256 * 256 * 256 * 256 * 256 * 256 * 256 * 256
                * 256 * 256,
            256 * 256 * 256 * 256 * 256 * 256 * 256 * 256 * 256 * 256 * 256 * 256 * 256
                * 256 * 256 + 3 * 256 * 256 * 256 * 256 * 256 + 255 * 256 + 123
        ];

        for (i in 0..vector::length(&inputs)) {
            test_u256(
                vector::borrow(&inputs, i),
                *vector::borrow(&expected_numbers, i)
            );
        };
    }
}
