#[cfg(test)]
mod tests {
    use redstone::helpers::iter_into::{IterInto, IterIntoOpt};
    use redstone_casper::contracts::run_mode::RunMode::Write;

    use crate::core::{
        run_env::RunEnv,
        sample::{sample_eth_btc_avax_5sig, SAMPLE_SYSTEM_TIMESTAMP},
    };

    #[test]
    fn test_get_price_and_timestamp() {
        let mut env = RunEnv::prepare();
        let adapter_key = env.install_default_price_adapter();
        let _ = env.install_price_feed(adapter_key, "ETH");
        let sample = sample_eth_btc_avax_5sig();

        env.price_adapter_process_payload(
            Write,
            vec!["ETH"],
            sample.read_bytes(),
            SAMPLE_SYSTEM_TIMESTAMP.into(),
        );

        let (value, timestamp) = env.price_feed_get_price_and_timestamp();

        sample.verify_results(
            vec!["ETH"].iter_into(),
            vec![value].iter_into_opt(),
            timestamp,
        );
    }
}
