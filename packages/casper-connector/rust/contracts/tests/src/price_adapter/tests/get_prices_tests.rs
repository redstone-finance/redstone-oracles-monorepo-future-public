#[cfg(test)]
mod tests {
    use redstone_casper::contracts::run_mode::RunMode::Get;

    use crate::core::{
        run_env::RunEnv,
        sample::{sample_eth_btc_avax_5sig, sample_eth_btc_avax_5sig_2, SAMPLE_SYSTEM_TIMESTAMP},
    };

    #[test]
    fn test_get_prices() {
        let mut env = RunEnv::prepare();
        env.install_default_price_adapter();

        env.price_adapter_process_payload(
            Get,
            vec!["ETH", "BTC", "AVAX"],
            sample_eth_btc_avax_5sig().read_bytes(),
            SAMPLE_SYSTEM_TIMESTAMP.into(),
        );
    }

    #[should_panic(expected = "ValueNotFound")]
    #[test]
    fn test_get_prices_not_written() {
        let mut env = RunEnv::prepare();
        env.install_default_price_adapter();

        env.price_adapter_process_payload(
            Get,
            vec!["ETH", "BTC"],
            sample_eth_btc_avax_5sig().read_bytes(),
            SAMPLE_SYSTEM_TIMESTAMP.into(),
        );
        env.price_adapter_read_price("ETH");
    }

    #[test]
    fn test_write_and_get_prices_same() {
        let mut env = RunEnv::prepare();
        env.install_default_price_adapter();
        let sample = &sample_eth_btc_avax_5sig();

        sample.env_test_write_prices(&mut env, None);
        sample.env_test_get_prices(&mut env, None, sample);
        sample.env_test_get_prices(&mut env, vec!["BTC", "ETH"].into(), sample);
    }

    #[test]
    fn test_write_and_get_prices_different() {
        let mut env = RunEnv::prepare();
        env.install_default_price_adapter();
        let sample = &sample_eth_btc_avax_5sig();

        sample.env_test_write_prices(&mut env, None);
        sample_eth_btc_avax_5sig_2().env_test_get_prices(&mut env, None, sample);
    }

    #[test]
    fn test_write_and_get_prices_override_older() {
        let mut env = RunEnv::prepare();
        env.install_default_price_adapter();
        let sample = &sample_eth_btc_avax_5sig_2();

        sample.env_test_write_prices(&mut env, None);
        sample_eth_btc_avax_5sig().env_test_get_prices(&mut env, None, sample);
    }

    #[should_panic(expected = "User error: 1050")]
    #[test]
    fn test_get_prices_timestamp_error() {
        let mut env = RunEnv::prepare();
        env.install_default_price_adapter();

        env.price_adapter_process_payload(
            Get,
            vec!["ETH"],
            sample_eth_btc_avax_5sig_2().read_bytes(),
            SAMPLE_SYSTEM_TIMESTAMP.into(),
        );
    }
}
