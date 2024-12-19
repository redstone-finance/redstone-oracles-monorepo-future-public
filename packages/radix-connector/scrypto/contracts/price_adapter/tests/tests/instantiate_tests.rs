#[cfg(test)]
mod tests {
    use crate::tests::PriceAdapterEnv;
    use common::test_helpers::env::{helpers::make_signers, run_env::PriceAdapterRunEnv};

    #[test]
    fn test_instantiate() {
        let mut price_adapter =
            PriceAdapterEnv::instantiate(3, make_signers(vec!["0x1111", "0x2222", "0x3311"]), None);

        assert_eq!(price_adapter.read_timestamp(None), 0u64);

        #[cfg(feature = "test_sim_env")]
        {
            let state = price_adapter.state();
            let signers = state.signers;
            assert_eq!(
                signers,
                vec![vec![17u8, 17u8], vec![34u8, 34u8], vec![51u8, 17u8]]
            );
            assert_eq!(state.signer_count_threshold, 3);
            assert_eq!(state.timestamp, 0u64);
            assert_eq!(state.prices, scrypto::prelude::HashMap::new());
        }
    }

    #[test]
    fn test_instantiate_signer_count_thresholds() {
        for i in 0u8..4 {
            let _ = PriceAdapterEnv::instantiate(
                i,
                make_signers(vec!["0x1111", "0x2222", "0x3311"]),
                None,
            );
        }
    }

    #[should_panic(expected = "Wrong signer count threshold value: 4")]
    #[test]
    fn test_instantiate_wrong_signer_count_threshold() {
        PriceAdapterEnv::instantiate(4, make_signers(vec!["0x1111", "0x2222", "0x3311"]), None);
    }

    #[should_panic(expected = "Signers must not be empty")]
    #[test]
    fn test_instantiate_empty_signers() {
        PriceAdapterEnv::instantiate(4, make_signers(vec![]), None);
    }
}
