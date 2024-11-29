#[cfg(test)]
mod tests {
    use crate::{
        sample::sample::{
            sample_eth_btc_avax_5sig, sample_eth_btc_avax_5sig_2, sample_eth_btc_avax_5sig_old,
        },
        tests::PriceAdapterEnv,
    };

    #[test]
    fn test_get_prices() {
        let sample = &sample_eth_btc_avax_5sig();
        let mut price_adapter: PriceAdapterEnv = sample.instantiate_price_adapter();

        sample.test_get_prices(&mut price_adapter, None);
    }

    #[should_panic(expected = "Contract error: Missing data feed value for #0 (BTC)")]
    #[test]
    fn test_get_prices_not_written() {
        let sample = &sample_eth_btc_avax_5sig();
        let mut price_adapter: PriceAdapterEnv = sample.instantiate_price_adapter();

        sample.test_get_prices(&mut price_adapter, None);
        sample.verify_written_values(&mut price_adapter, vec!["BTC"].into());
    }

    #[test]
    fn test_write_and_get_prices_same() {
        let sample = &sample_eth_btc_avax_5sig();
        let mut price_adapter: PriceAdapterEnv = sample.instantiate_price_adapter();

        sample.test_write_prices(&mut price_adapter, None);
        sample.test_get_prices(&mut price_adapter, None);
        sample.test_get_prices(&mut price_adapter, vec!["BTC", "ETH"].into());
    }

    #[test]
    fn test_write_and_get_prices_different() {
        let sample = &sample_eth_btc_avax_5sig();
        let mut price_adapter: PriceAdapterEnv = sample.instantiate_price_adapter();

        sample.test_write_prices(&mut price_adapter, None);
        sample_eth_btc_avax_5sig_2().test_get_prices(&mut price_adapter, None);
        sample.verify_written_values(&mut price_adapter, None);
    }

    #[test]
    fn test_write_and_get_prices_override_older() {
        let sample = &sample_eth_btc_avax_5sig_2();
        let mut price_adapter: PriceAdapterEnv = sample.instantiate_price_adapter();

        sample.test_write_prices(&mut price_adapter, None);
        sample_eth_btc_avax_5sig().test_get_prices(&mut price_adapter, None);
        sample.verify_written_values(&mut price_adapter, None);
    }

    #[should_panic(expected = "Timestamp 1725975870000 is too future for #0")]
    #[test]
    fn test_get_prices_timestamp_error() {
        let sample = &sample_eth_btc_avax_5sig_old();
        let mut price_adapter: PriceAdapterEnv = sample.instantiate_price_adapter();

        sample_eth_btc_avax_5sig_2().test_get_prices(&mut price_adapter, None);
    }
}
