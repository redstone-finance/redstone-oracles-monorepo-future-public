#[cfg(test)]
mod tests {
    use redstone::network::specific::U256;
    use redstone_casper::contracts::run_mode::RunMode::Write;

    use crate::{
        core::{
            run_env::RunEnv,
            sample::{
                sample_eth_btc_avax_5sig, sample_eth_btc_avax_5sig_2, SAMPLE_SYSTEM_TIMESTAMP_2,
            },
        },
        hashmap,
    };

    #[test]
    fn test_write_prices() {
        let mut env = RunEnv::prepare();
        env.install_default_price_adapter();

        sample_eth_btc_avax_5sig().env_test_write_prices(&mut env, None);
    }

    #[should_panic(expected = "ValueNotFound")]
    #[test]
    fn test_write_prices_not_all() {
        let mut env = RunEnv::prepare();
        env.install_default_price_adapter();

        sample_eth_btc_avax_5sig().env_test_write_prices(&mut env, vec!["ETH", "BTC"].into());
        env.price_adapter_read_price("AVAX");
    }

    #[should_panic(expected = "User error: 250")]
    #[test]
    fn test_write_prices_twice_same() {
        let mut env = RunEnv::prepare();
        env.install_default_price_adapter();
        let sample = sample_eth_btc_avax_5sig();

        sample.env_test_write_prices(&mut env, None);
        sample.env_test_write_prices(&mut env, None);
    }

    #[should_panic(expected = "User error: 250")]
    #[test]
    fn test_write_prices_twice_different() {
        let mut env = RunEnv::prepare();
        env.install_default_price_adapter();
        let sample = sample_eth_btc_avax_5sig();

        sample.env_test_write_prices(&mut env, vec!["ETH"].into());
        sample.env_test_write_prices(&mut env, vec!["BTC"].into());
    }

    #[test]
    fn test_write_prices_override() {
        let mut env = RunEnv::prepare();
        env.install_default_price_adapter();

        sample_eth_btc_avax_5sig().env_test_write_prices(&mut env, None);
        sample_eth_btc_avax_5sig_2().env_test_write_prices(&mut env, None);
    }

    #[test]
    fn test_write_prices_override_different() {
        let mut env = RunEnv::prepare();
        env.install_default_price_adapter();
        let mut sample = sample_eth_btc_avax_5sig_2();

        sample_eth_btc_avax_5sig().env_test_write_prices(&mut env, None);
        sample.env_test_write_prices(&mut env, vec!["ETH"].into());

        sample.values = hashmap!("ETH" => sample.values["ETH"], "BTC" => 0u128, "AVAX" => 0u128 );
        sample.env_verify_values(&mut env, None);
    }

    #[should_panic(expected = "User error: 250")]
    #[test]
    fn test_write_prices_override_older() {
        let mut env = RunEnv::prepare();
        env.install_default_price_adapter();

        sample_eth_btc_avax_5sig_2().env_test_write_prices(&mut env, None);
        sample_eth_btc_avax_5sig().env_test_write_prices(&mut env, None);
    }

    #[should_panic(expected = "User error: 1000")]
    #[test]
    fn test_write_prices_timestamp_error() {
        let mut env = RunEnv::prepare();
        env.install_default_price_adapter();

        env.price_adapter_process_payload(
            Write,
            vec!["ETH"],
            sample_eth_btc_avax_5sig().read_bytes(),
            SAMPLE_SYSTEM_TIMESTAMP_2.into(),
        );
    }
}
