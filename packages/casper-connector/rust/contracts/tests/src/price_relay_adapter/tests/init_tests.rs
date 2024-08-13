#[cfg(test)]
mod tests {
    use casper_types::{bytesrepr::Bytes, ContractHash, ContractPackageHash, Key, RuntimeArgs};

    use redstone::network::as_str::AsHexStr;
    use redstone_casper::contracts::constants::{
        ENTRY_POINT_INIT, STORAGE_KEY_ADAPTER_ADDRESS, STORAGE_KEY_VALUES,
    };

    use crate::core::{run_env::RunEnv, utils::hash_message};

    #[test]
    fn test_init() {
        let mut env = RunEnv::prepare();
        let price_adapter_key = env.install_default_price_adapter();
        env.install_price_relay_adapter(price_adapter_key);

        assert!(env
            .query_contract(RunEnv::PRICE_RELAY_ADAPTER_KEY, STORAGE_KEY_VALUES)
            .is_ok());
        assert!(env
            .query_contract_dic(
                RunEnv::PRICE_RELAY_ADAPTER_KEY,
                STORAGE_KEY_VALUES,
                &hash_message(&Bytes::new()).as_hex_str()
            )
            .err()
            .unwrap()
            .contains("ValueNotFound"));

        let adapter_address: ContractHash = env.unpack(
            env.query_contract(RunEnv::PRICE_RELAY_ADAPTER_KEY, STORAGE_KEY_ADAPTER_ADDRESS),
        );

        assert_eq!(
            adapter_address,
            ContractHash::new(price_adapter_key.into_hash().unwrap())
        );
    }

    #[should_panic(expected = "User error: 10")]
    #[test]
    fn test_init_twice() {
        let mut env = RunEnv::prepare();
        let price_adapter_key = env.install_default_price_adapter();
        env.install_price_relay_adapter(price_adapter_key);
        env.price_relay_adapter_init(price_adapter_key);
    }

    #[should_panic(expected = "Invalid context")]
    #[test]
    fn test_init_must_be_called_by_owner() {
        let mut env = RunEnv::prepare();
        let price_adapter_key = env.install_default_price_adapter();
        let price_relay_adapter_key = env.install_price_relay_adapter(price_adapter_key);

        env.call_entry_point_with_account(
            env.other_account.account_hash(),
            ContractPackageHash::new(price_relay_adapter_key.into_hash().unwrap()),
            ENTRY_POINT_INIT,
            RuntimeArgs::new(),
        );
    }

    #[should_panic(expected = "ApiError::MissingArgument")]
    #[test]
    fn test_init_missing_args() {
        let mut env = RunEnv::prepare();
        env.deploy_price_relay_adapter();
        env.call_entry_point(
            RunEnv::PRICE_RELAY_ADAPTER_KEY,
            ENTRY_POINT_INIT,
            RuntimeArgs::new(),
        );
    }

    #[should_panic(expected = "User error: 15")]
    #[test]
    fn test_init_wrong_adapter_address() {
        let mut env = RunEnv::prepare();
        env.install_price_relay_adapter(Key::EraSummary);
    }
}
