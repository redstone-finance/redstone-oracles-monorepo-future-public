module redstone_price_adapter::redstone_sdk_validate {
    // ==== Imports ===

    use redstone_price_adapter::redstone_sdk_config::{
        Config,
        signer_count_threshold,
        signers,
        max_timestamp_ahead_ms,
        max_timestamp_delay_ms
    };
    use redstone_price_adapter::redstone_sdk_data_package::{
        DataPackage,
        signer_address,
        timestamp
    };
    use std::vector;

    // === Errors ===

    const E_INVALID_REDSTONE_MARKER: u64 = 0;
    const E_TIMESTAMP_TOO_OLD: u64 = 1;
    const E_TIMESTAMP_TOO_FUTURE: u64 = 2;
    const E_INSUFFICIENT_SIGNER_COUNT: u64 = 3;
    const E_TIMESTAMP_MISMATCH: u64 = 4;
    const E_EMPTY_DATA_PACKAGES: u64 = 5;

    // === Constants ===

    const REDSTONE_MARKER: vector<u8> = x"000002ed57011e0000";
    const REDSTONE_MARKER_LEN: u64 = 9;

    // === Public Functions ===

    public fun verify_data_packages(
        data_packages: &vector<DataPackage>,
        config: &Config,
        current_timestamp: u64
    ) {
        verify_timestamps_are_the_same(data_packages);

        // verify that packages timestamp is not stale
        verify_timestamp(
            timestamp(vector::borrow(data_packages, 0)),
            config,
            current_timestamp
        );

        verify_signer_count(
            data_packages,
            signer_count_threshold(config),
            &signers(config)
        );
    }

    public fun verify_and_trim_redstone_marker(bytes: &mut vector<u8>) {
        let bytes_len = vector::length(bytes);
        assert!(bytes_len >= REDSTONE_MARKER_LEN, E_INVALID_REDSTONE_MARKER);

        for (i in 0..REDSTONE_MARKER_LEN) {
            assert!(
                vector::pop_back(bytes) == *vector::borrow(&REDSTONE_MARKER, REDSTONE_MARKER_LEN - 1 - i),
                E_INVALID_REDSTONE_MARKER);
        };
    }

    // === Private Functions ===

    fun verify_timestamps_are_the_same(
        data_packages: &vector<DataPackage>
    ) {
        assert!(!vector::is_empty(data_packages), E_EMPTY_DATA_PACKAGES);

        let ts = timestamp(vector::borrow(data_packages, 0));
        let data_package_len = vector::length(data_packages);
        for (i in 1..data_package_len) {
            assert!(
                timestamp(vector::borrow(data_packages, i)) == ts, E_TIMESTAMP_MISMATCH
            );
        };
    }

    fun verify_timestamp(
        package_timestamp: u64, config: &Config, current_timestamp: u64
    ) {
        assert!(
            package_timestamp + max_timestamp_delay_ms(config) >= current_timestamp,
            E_TIMESTAMP_TOO_OLD
        );
        assert!(
            package_timestamp <= current_timestamp + max_timestamp_ahead_ms(config),
            E_TIMESTAMP_TOO_FUTURE
        );
    }

    fun verify_signer_count(
        data_packages: &vector<DataPackage>,
        threshold: u8,
        signers: &vector<vector<u8>>
    ) {
        let count = 0;
        let signers_len = vector::length(signers);

        let signers_cp = vector::empty();
        for (i in 0..signers_len) {
            vector::push_back(&mut signers_cp, *vector::borrow(signers, i));
        };

        for (i in 0..(vector::length(data_packages) as u64)) {
            let package = vector::borrow(data_packages, i);
            let address = signer_address(package);

            let (found, idx) = vector::index_of(&signers_cp, address);
            
            if (found) {
                count = count + 1;
                let signers_temp = vector::empty();
                for (j in 0..(vector::length(&signers_cp) as u64)) {
                      if (j != idx) { vector::push_back(&mut signers_temp, *vector::borrow(&signers_cp, j)) };  
                };
                signers_cp = signers_temp;
            };

            if (count >= threshold) { return };
        };

        assert!(count >= threshold, E_INSUFFICIENT_SIGNER_COUNT);
    }

    // === Tests Functions ===

    #[test_only]
    use redstone_price_adapter::redstone_sdk_config::test_config;
    #[test_only]
    use redstone_price_adapter::redstone_sdk_data_package::new_data_package;

    #[test]
    fun test_trim_redstone_marker() {
        let payload = x"000002ed57011e0000";
        verify_and_trim_redstone_marker(&mut payload);

        assert!(payload == vector::empty(), vector::length(&payload));
    }

    #[test]
    fun test_verify_timestamps_are_the_same() {
        let data_packages = vector::empty();
        for (i in 0..10) {
            vector::push_back(
                &mut data_packages,
                new_data_package(x"", 10, vector[])
            );
        };

        verify_timestamps_are_the_same(&data_packages);
    }

    #[test]
    #[expected_failure(abort_code = E_TIMESTAMP_MISMATCH)]
    fun test_verify_timestamps_are_the_same_different_timestamps() {
        let data_packages = vector::empty();
        for (i in 0..10) {
            vector::push_back(
                &mut data_packages,
                new_data_package(x"", i, vector[])
            );
        };

        verify_timestamps_are_the_same(&data_packages);
    }

    #[test]
    #[expected_failure(abort_code = E_EMPTY_DATA_PACKAGES)]
    fun test_verify_timestamps_are_the_same_empty() {
        verify_timestamps_are_the_same(&vector[]);
    }

    #[test]
    fun test_verify_timestamp() {
        let config = test_config();
        let current = 1_000;

        let nums = vector[0, 10, 200, 500];

        for (i in 0..vector::length(&nums)) {
            let num = vector::borrow(&nums, i);
            verify_timestamp(current - *num, &config, current);
            verify_timestamp(current + *num, &config, current);
        };
    }

    #[test]
    #[expected_failure(abort_code = E_TIMESTAMP_TOO_FUTURE)]
    fun test_verify_timestamp_too_future() {
        let config = test_config();

        verify_timestamp(
            1000 + max_timestamp_ahead_ms(&config) + 1,
            &config,
            1000
        );
    }

    #[test]
    #[expected_failure(abort_code = E_TIMESTAMP_TOO_OLD)]
    fun test_verify_timestamp_too_old() {
        let config = test_config();
        let value = 1_000_000;

        verify_timestamp(
            value - max_timestamp_delay_ms(&config) - 1,
            &config,
            value
        );
    }

    #[test]
    fun test_verify_signer_count() {
        let data_packages = vector[
            new_data_package(x"00", 10, vector[]),
            new_data_package(x"01", 10, vector[]),
            new_data_package(x"02", 10, vector[]),
            new_data_package(x"03", 10, vector[]),
            new_data_package(x"04", 10, vector[])
        ];

        let signers = vector[x"00", x"01", x"02", x"03"];

        for (i in 0..5) {
            verify_signer_count(&data_packages, (i as u8), &signers);
        };
    }

    #[test]
    fun test_verify_signer_count_success() {
        let data_packages = vector[
            new_data_package(x"00", 10, vector[]),
            new_data_package(x"01", 10, vector[]),
            new_data_package(x"02", 10, vector[]),
            new_data_package(x"03", 10, vector[]),
            new_data_package(x"04", 10, vector[])
        ];

        let signers = vector[x"00", x"01"];
        for (i in 0..3) {
            verify_signer_count(&data_packages, (i as u8), &signers);
        };
    }

    #[test]
    #[expected_failure(abort_code = E_INSUFFICIENT_SIGNER_COUNT)]
    fun test_verify_signer_count_fail() {
        let data_packages = vector[
            new_data_package(x"00", 10, vector[]),
            new_data_package(x"01", 10, vector[]),
            new_data_package(x"02", 10, vector[]),
            new_data_package(x"03", 10, vector[]),
            new_data_package(x"04", 10, vector[])
        ];

        let signers = vector[x"00", x"01", x"02", x"03"];

        verify_signer_count(&data_packages, 5, &signers)
    }

    #[test]
    #[expected_failure(abort_code = E_INSUFFICIENT_SIGNER_COUNT)]
    fun test_verify_signer_count_unknow_signers() {
        let data_packages = vector[
            new_data_package(x"00", 10, vector[]),
            new_data_package(x"01", 10, vector[]),
            new_data_package(x"02", 10, vector[]),
            new_data_package(x"03", 10, vector[]),
            new_data_package(x"04", 10, vector[])
        ];

        let signers = vector[x"11", x"12", x"13", x"14"];

        verify_signer_count(&data_packages, 3, &signers)
    }

    #[test]
    #[expected_failure(abort_code = E_INVALID_REDSTONE_MARKER)]
    fun test_verify_and_trim_redstone_marker_bad_last_byte() {
        verify_and_trim_redstone_marker(&mut x"000002ed57011e0001");
    }

    #[test]
    #[expected_failure(abort_code = E_INVALID_REDSTONE_MARKER)]
    fun test_verify_and_trim_redstone_marker_bad_first_byte() {
        verify_and_trim_redstone_marker(&mut x"100002ed57011e0000");
    }

    #[test]
    #[expected_failure(abort_code = E_INVALID_REDSTONE_MARKER)]
    fun test_verify_and_trim_redstone_marker_bad_marker() {
        let markers = vector::empty();
        for (i in 0..10) {
            vector::push_back(&mut markers, (i as u8));
        };
        verify_and_trim_redstone_marker(&mut markers);
    }

    #[test]
    fun test_verify_and_trim_redstone_marker() {
        let correct_marker = REDSTONE_MARKER;
        verify_and_trim_redstone_marker(&mut correct_marker);
    }

    #[test]
    fun test_verify_data_packages() {
        let config = test_config();
        let timestamp = 1000;

        let data_packages = vector[
            new_data_package(
                *vector::borrow(&signers(&config), 0),
                timestamp,
                vector[]
            ),
            new_data_package(
                *vector::borrow(&signers(&config), 0),
                timestamp,
                vector[]
            ),
            new_data_package(
                *vector::borrow(&signers(&config), 1),
                timestamp,
                vector[]
            ),
            new_data_package(
                *vector::borrow(&signers(&config), 1),
                timestamp,
                vector[]
            ),
            new_data_package(
                *vector::borrow(&signers(&config), 1),
                timestamp,
                vector[]
            )
        ];

        verify_data_packages(&data_packages, &config, 1000)
    }
}
