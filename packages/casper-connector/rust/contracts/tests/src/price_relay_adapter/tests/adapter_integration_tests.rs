#[cfg(test)]
mod tests {
    use casper_types::bytesrepr::Bytes;
    use rand::random;

    use redstone::{helpers::hex::make_feed_ids, network::as_str::AsHexStr};
    use redstone_casper::contracts::{
        computed_value::ComputedValue,
        run_mode::{
            RunMode,
            RunMode::{Get, Write},
        },
    };

    use crate::core::{
        run_env::RunEnv,
        sample::{sample_eth_btc_avax_5sig, Sample, SAMPLE_SYSTEM_TIMESTAMP},
        utils::hash_message,
    };

    #[test]
    fn test_process_payload_get_prices() {
        let sample = sample_eth_btc_avax_5sig();
        let results =
            test_process_payload(&mut RunEnv::prepare(), Get, false, &sample, None).unwrap();

        sample.verify_computed_value(&results[0], None);
    }

    #[test]
    fn test_process_payload_get_prices_chunks() {
        let sample = sample_eth_btc_avax_5sig();
        let results =
            test_process_payload(&mut RunEnv::prepare(), Get, true, &sample, None).unwrap();

        sample.verify_computed_value(&results[0], None);
    }

    #[test]
    fn test_process_payload_get_prices_multiple_times() {
        let sample = sample_eth_btc_avax_5sig();
        let mut env = RunEnv::prepare();
        let adapter_key = env.install_default_price_adapter();
        let _ = env.install_price_relay_adapter(adapter_key);

        let feed_id_samples = vec![
            vec!["BTC"],
            vec!["ETH", "BTC"],
            vec!["ETH"],
            vec!["BTC"],
            vec!["ETH", "BTC"],
        ];

        for case_number in 0..feed_id_samples.len() {
            let results = env
                .price_relay_adapter_process_payload(
                    Get,
                    &feed_id_samples[case_number],
                    sample.read_bytes(),
                    SAMPLE_SYSTEM_TIMESTAMP.into(),
                    random(),
                )
                .unwrap();

            for i in 0..case_number {
                sample.verify_computed_value(&results[i], feed_id_samples[i].clone().into())
            }
        }
    }

    #[test]
    fn test_process_payload_get_prices_with_existing_payload() {
        let mut env = RunEnv::prepare();
        let sample = sample_eth_btc_avax_5sig();
        let results = test_process_payload(&mut env, Get, true, &sample, None).unwrap();

        sample.verify_computed_value(&results[0], None);

        let hash = hash_message(&sample.read_bytes());
        env.process_chunk(
            Get,
            make_feed_ids(vec!["BTC"]),
            &hash,
            SAMPLE_SYSTEM_TIMESTAMP,
            4,
            Bytes::new(),
        );

        let results = env.price_relay_adapter_read_computed_values(&hash.as_hex_str());
        sample.verify_computed_value(&results[0], None);
        sample.verify_computed_value(&results[1], vec!["BTC"].into());
    }

    #[test]
    fn test_process_payload_write_prices() {
        let mut env = RunEnv::prepare();
        let sample = sample_eth_btc_avax_5sig();
        test_process_payload(&mut env, Write, false, &sample, None);

        sample.verify_written_values(&mut env);
    }

    #[test]
    fn test_process_payload_write_prices_chunks() {
        let mut env = RunEnv::prepare();
        let sample = sample_eth_btc_avax_5sig();
        test_process_payload(&mut env, Write, true, &sample, None);

        sample.verify_written_values(&mut env);
    }

    #[should_panic(expected = "User error: 250")]
    #[test]
    fn test_process_payload_write_prices_twice() {
        let mut env = RunEnv::prepare();
        let sample = sample_eth_btc_avax_5sig();
        test_process_payload(&mut env, Write, false, &sample, None);

        env.price_relay_adapter_process_payload(
            Write,
            &["ETH", "BTC"],
            sample.read_bytes(),
            SAMPLE_SYSTEM_TIMESTAMP.into(),
            true,
        );
    }

    #[should_panic(expected = "User error: 1050")]
    #[test]
    fn test_process_payload_propagates_adapter_results() {
        test_process_payload(
            &mut RunEnv::prepare(),
            Get,
            true,
            &sample_eth_btc_avax_5sig(),
            0.into(),
        )
        .unwrap();
    }

    fn test_process_payload(
        env: &mut RunEnv,
        mode: RunMode,
        in_chunks: bool,
        sample: &Sample,
        overwrite_current_timestamp: Option<u64>,
    ) -> Option<Vec<ComputedValue>> {
        let adapter_key = env.install_default_price_adapter();
        let _ = env.install_price_relay_adapter(adapter_key);

        env.price_relay_adapter_process_payload(
            mode,
            &["ETH", "BTC"],
            sample.read_bytes(),
            overwrite_current_timestamp
                .unwrap_or(SAMPLE_SYSTEM_TIMESTAMP)
                .into(),
            in_chunks,
        )
    }
}
