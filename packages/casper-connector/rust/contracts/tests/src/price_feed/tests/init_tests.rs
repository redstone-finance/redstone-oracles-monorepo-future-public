#[cfg(test)]
mod tests {
    use casper_types::{ContractHash, ContractPackageHash, Key, RuntimeArgs, U256};

    use redstone::helpers::hex::make_feed_id;
    use redstone_casper::contracts::constants::{ENTRY_POINT_INIT, STORAGE_KEY_ADAPTER_ADDRESS};

    use crate::core::run_env::RunEnv;

    #[test]
    fn test_init() {
        let mut env = RunEnv::prepare();
        let price_adapter_key = env.install_default_price_adapter();
        env.install_price_feed(price_adapter_key, "AVAX");

        assert_eq!(env.price_feed_read_timestamp(), 0u64);
        assert_eq!(env.price_feed_read_price(), U256::zero());

        let feed_id: U256 = env.unpack(env.query_contract(RunEnv::PRICE_FEED_KEY, "feed_id"));
        assert_eq!(feed_id, make_feed_id("AVAX"));

        let adapter_address: ContractHash =
            env.unpack(env.query_contract(RunEnv::PRICE_FEED_KEY, STORAGE_KEY_ADAPTER_ADDRESS));

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
        env.install_price_feed(price_adapter_key, "ETH");
        env.price_feed_init(price_adapter_key, "BTC");
    }

    #[should_panic(expected = "Invalid context")]
    #[test]
    fn test_init_must_be_called_by_owner() {
        let mut env = RunEnv::prepare();
        let price_adapter_key = env.install_default_price_adapter();
        let price_feed_key = env.install_price_feed(price_adapter_key, "ETH");

        env.call_entry_point_with_account(
            env.other_account.account_hash(),
            ContractPackageHash::new(price_feed_key.into_hash().unwrap()),
            ENTRY_POINT_INIT,
            RuntimeArgs::new(),
        );
    }

    #[should_panic(expected = "ApiError::MissingArgument")]
    #[test]
    fn test_init_missing_args() {
        let mut env = RunEnv::prepare();
        env.deploy_price_feed(None);
        env.call_entry_point(RunEnv::PRICE_FEED_KEY, ENTRY_POINT_INIT, RuntimeArgs::new());
    }

    #[should_panic(expected = "User error: 15")]
    #[test]
    fn test_init_wrong_adapter_address() {
        let mut env = RunEnv::prepare();
        env.install_price_feed(Key::EraSummary, "BTC");
    }
}
