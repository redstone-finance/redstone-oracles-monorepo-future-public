#[cfg(test)]
mod tests {
    use crate::{
        hashmap,
        sample::sample::{
            sample_eth_btc_avax_5sig, sample_eth_btc_avax_5sig_2, sample_eth_btc_avax_5sig_old,
        },
        tests::PriceAdapterEnv,
    };
    use redstone::network::specific::U256;

    #[test]
    fn test_write_prices() {
        let sample = &sample_eth_btc_avax_5sig();
        let mut price_adapter: PriceAdapterEnv = sample.instantiate_price_adapter();

        sample.test_write_prices(&mut price_adapter, None);
    }

    #[should_panic(expected = "Contract error: Missing data feed value for #0 (AVAX)")]
    #[test]
    fn test_write_prices_not_all() {
        let sample = &sample_eth_btc_avax_5sig();
        let mut price_adapter: PriceAdapterEnv = sample.instantiate_price_adapter();

        sample.test_write_prices(&mut price_adapter, vec!["ETH", "BTC"].into());
        sample.verify_written_values(&mut price_adapter, vec!["BTC"].into());
        sample.verify_written_values(&mut price_adapter, vec!["AVAX"].into());
    }

    #[should_panic(expected = "Contract error: Timestamp must be greater than before")]
    #[test]
    fn test_write_prices_twice_same() {
        let sample = &sample_eth_btc_avax_5sig();
        let mut price_adapter: PriceAdapterEnv = sample.instantiate_price_adapter();

        sample.test_write_prices(&mut price_adapter, None);
        sample.test_write_prices(&mut price_adapter, None);
    }

    #[should_panic(expected = "Contract error: Timestamp must be greater than before")]
    #[test]
    fn test_write_prices_twice_different() {
        let sample = &sample_eth_btc_avax_5sig();
        let mut price_adapter: PriceAdapterEnv = sample.instantiate_price_adapter();

        sample.test_write_prices(&mut price_adapter, vec!["ETH"].into());
        sample.test_write_prices(&mut price_adapter, vec!["BTC"].into());
    }

    #[test]
    fn test_write_prices_override() {
        let sample = &sample_eth_btc_avax_5sig();
        let mut price_adapter: PriceAdapterEnv = sample.instantiate_price_adapter();

        sample.test_write_prices(&mut price_adapter, None);
        sample_eth_btc_avax_5sig_2().test_write_prices(&mut price_adapter, None);
    }

    #[test]
    fn test_write_prices_override_different() {
        let sample = &sample_eth_btc_avax_5sig_2();
        let mut price_adapter: PriceAdapterEnv = sample.instantiate_price_adapter();

        sample_eth_btc_avax_5sig().test_write_prices(&mut price_adapter, None);
        sample.test_write_prices(&mut price_adapter, vec!["ETH"].into());

        let mut new_sample = sample.clone();

        new_sample.values = hashmap!("ETH" => sample.values["ETH"]);
        new_sample.verify_written_values(&mut price_adapter, None);
    }

    #[should_panic(expected = "Contract error: Timestamp must be greater than before")]
    #[test]
    fn test_write_prices_override_by_older() {
        let sample = &sample_eth_btc_avax_5sig_2();
        let mut price_adapter: PriceAdapterEnv = sample.instantiate_price_adapter();

        sample.test_write_prices(&mut price_adapter, None);
        sample_eth_btc_avax_5sig().test_write_prices(&mut price_adapter, None);
    }

    #[should_panic(expected = "Timestamp 1725975870000 is too future for #0")]
    #[test]
    fn test_write_prices_timestamp_error() {
        let sample = &sample_eth_btc_avax_5sig_old();
        let mut price_adapter: PriceAdapterEnv = sample.instantiate_price_adapter();

        sample_eth_btc_avax_5sig_2().test_write_prices(&mut price_adapter, None);
    }
}
