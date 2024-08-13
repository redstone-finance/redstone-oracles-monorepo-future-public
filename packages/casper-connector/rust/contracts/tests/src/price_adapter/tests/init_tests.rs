#[cfg(test)]
mod tests {
    use casper_types::{ContractPackageHash, RuntimeArgs};

    use redstone::network::specific::Bytes;
    use redstone_casper::contracts::constants::{ENTRY_POINT_INIT, STORAGE_KEY_VALUES};

    use crate::core::run_env::RunEnv;

    #[test]
    fn test_init() {
        let mut env = RunEnv::prepare();
        env.install_price_adapter(vec!["0x1111", "0x2222", "0x3311"], 3);

        assert_eq!(env.price_adapter_read_timestamp(), 0u64);

        assert!(env
            .query_contract(RunEnv::PRICE_ADAPTER_KEY, STORAGE_KEY_VALUES)
            .is_ok());
        assert!(env
            .query_contract_dic(RunEnv::PRICE_ADAPTER_KEY, STORAGE_KEY_VALUES, "ETH")
            .err()
            .unwrap()
            .contains("ValueNotFound"));

        let signers: Vec<Bytes> =
            env.unpack(env.query_contract(RunEnv::PRICE_ADAPTER_KEY, "signers"));
        assert_eq!(signers.len(), 3);
        assert_eq!(signers[0], vec![17, 17].into());
        assert_eq!(signers[1], vec![34, 34].into());
        assert_eq!(signers[2], vec![51, 17].into());

        let signer_count_threshold: u8 =
            env.unpack(env.query_contract(RunEnv::PRICE_ADAPTER_KEY, "signer_count_threshold"));

        assert_eq!(signer_count_threshold, 3);
    }

    #[test]
    fn test_init_signer_count_thresholds() {
        let mut env = RunEnv::prepare();

        for i in 0..4 {
            env.install_price_adapter(vec!["0x1111", "0x2222", "0x3311"], i);
        }
    }

    #[should_panic(expected = "User error: 10")]
    #[test]
    fn test_init_twice() {
        let mut env = RunEnv::prepare();
        env.install_default_price_adapter();
        env.price_adapter_init(vec!["0x1111"], 1);
    }

    #[should_panic(expected = "Invalid context")]
    #[test]
    fn test_init_must_be_called_by_owner() {
        let mut env = RunEnv::prepare();
        let price_adapter_key = env.install_default_price_adapter();

        env.call_entry_point_with_account(
            env.other_account.account_hash(),
            ContractPackageHash::new(price_adapter_key.into_hash().unwrap()),
            ENTRY_POINT_INIT,
            RuntimeArgs::new(),
        );
    }

    #[should_panic(expected = "ApiError::MissingArgument")]
    #[test]
    fn test_init_missing_args() {
        let mut env = RunEnv::prepare();
        env.deploy_price_adapter();
        env.call_entry_point(
            RunEnv::PRICE_ADAPTER_KEY,
            ENTRY_POINT_INIT,
            RuntimeArgs::new(),
        );
    }

    #[should_panic(expected = "User error: 240")]
    #[test]
    fn test_init_wrong_signer_count_threshold() {
        let mut env = RunEnv::prepare();
        env.install_price_adapter(vec!["0x1111", "0x2222", "0x3311"], 4);
    }

    #[should_panic(expected = "User error: 241")]
    #[test]
    fn test_init_empty_signers() {
        let mut env = RunEnv::prepare();
        env.install_price_adapter(vec![], 4);
    }
}
