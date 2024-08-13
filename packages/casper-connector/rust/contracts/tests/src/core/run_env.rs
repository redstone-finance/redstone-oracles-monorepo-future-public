use std::path::PathBuf;

use casper_engine_test_support::{
    DeployItemBuilder, ExecuteRequestBuilder, InMemoryWasmTestBuilder, ARG_AMOUNT,
    DEFAULT_ACCOUNT_INITIAL_BALANCE, DEFAULT_CHAINSPEC_REGISTRY, DEFAULT_GENESIS_CONFIG,
    DEFAULT_GENESIS_CONFIG_HASH, DEFAULT_PAYMENT,
};
use casper_execution_engine::{
    core::engine_state::{
        execution_result::ExecutionResult, run_genesis_request::RunGenesisRequest, ExecuteRequest,
        GenesisAccount,
    },
    shared::transform::Transform,
};
use casper_types::{
    account::AccountHash, bytesrepr::FromBytes, runtime_args, CLTyped, Contract, Key, Motes,
    PublicKey, RuntimeArgs, SecretKey, StoredValue, U512,
};

use redstone_casper::contracts::constants::ARG_NAME_CONTRACT_PACKAGE_HASH;

pub(crate) struct RunEnv {
    pub(crate) builder: InMemoryWasmTestBuilder,
    pub(crate) account: GenesisAccount,

    #[cfg(test)]
    pub(crate) other_account: GenesisAccount,
}

impl RunEnv {
    pub(crate) fn prepare() -> Self {
        let account = Self::new_account([8u8; 32]);
        let _other_account = Self::new_account([7u8; 32]);

        let mut genesis_config = DEFAULT_GENESIS_CONFIG.clone();
        genesis_config.ee_config_mut().push_account(account.clone());

        #[cfg(test)]
        {
            genesis_config
                .ee_config_mut()
                .push_account(_other_account.clone());
        }
        let run_genesis_request = RunGenesisRequest::new(
            *DEFAULT_GENESIS_CONFIG_HASH,
            genesis_config.protocol_version(),
            genesis_config.take_ee_config(),
            DEFAULT_CHAINSPEC_REGISTRY.clone(),
        );

        let mut builder = InMemoryWasmTestBuilder::default();
        builder.run_genesis(&run_genesis_request).commit();

        RunEnv {
            builder,
            account,

            #[cfg(test)]
            other_account: _other_account,
        }
    }

    fn new_account(seed: [u8; 32]) -> GenesisAccount {
        let secret_key = SecretKey::ed25519_from_bytes(seed).unwrap();
        let public_key = PublicKey::from(&secret_key);

        GenesisAccount::account(
            public_key,
            Motes::new(U512::from(DEFAULT_ACCOUNT_INITIAL_BALANCE)),
            None,
        )
    }

    pub(crate) fn deploy(&mut self, wasm: &str, package_key: Option<Key>) -> Key {
        let deploy_request = Self::make_deploy_request(
            wasm,
            runtime_args! {
                ARG_NAME_CONTRACT_PACKAGE_HASH => package_key
            },
            self.account.account_hash(),
        );

        self.builder.exec(deploy_request).commit().expect_success();

        let ExecutionResult::Success {
            execution_journal, transfers: _, cost: _
        } =
            self.builder.last_exec_result() else { panic!("Failure!") };

        let transforms: Vec<_> = execution_journal
            .iter()
            .filter(|(_key, transform)| {
                matches!(transform, Transform::Write(StoredValue::ContractPackage(_)))
            })
            .map(|item| (item.0, item.1.clone()))
            .collect();

        let (Key::Hash(_), Transform::Write(StoredValue::ContractPackage(_))) = transforms[0] else { panic!("Not deployed!") };

        transforms[0].0
    }

    pub(crate) fn get_contract(&self, name: &str) -> Contract {
        let stored_value = self.query_contract(name, "").expect("should be a value");
        let contract = stored_value.as_contract().expect("Must be a contract");

        contract.clone()
    }

    pub(crate) fn query_contract(&self, name: &str, path: &str) -> Result<StoredValue, String> {
        let hash_addr = self
            .builder
            .get_expected_account(self.account.account_hash())
            .named_keys()
            .get(name)
            .expect("must have contract hash key as part of contract creation")
            .into_hash()
            .expect("must be a hash");

        let path_str: &[String] = &[path.to_string()];
        let path: &[String] = if !path.is_empty() { path_str } else { &[] };

        self.builder.query(None, Key::Hash(hash_addr), path)
    }

    pub(crate) fn query_contract_dic(
        &self,
        name: &str,
        dic_name: &str,
        path: &str,
    ) -> Result<StoredValue, String> {
        let contract = self.get_contract(name);
        let dictionary_uref = contract
            .named_keys()
            .get(dic_name)
            .expect("Must exist")
            .into_uref()
            .expect("Must be an uref");

        self.builder
            .query_dictionary_item(None, dictionary_uref, path)
    }

    pub(crate) fn call_entry_point(
        &mut self,
        name: &str,
        entry_point: &str,
        args: RuntimeArgs,
    ) -> &ExecutionResult {
        let result = ExecuteRequestBuilder::contract_call_by_name(
            self.account.account_hash(),
            name,
            entry_point,
            args,
        )
        .build();

        self.execute(result)
    }

    #[cfg(test)]
    pub(crate) fn call_entry_point_with_account(
        &mut self,
        account_hash: AccountHash,
        contract_hash: casper_types::ContractPackageHash,
        entry_point: &str,
        args: RuntimeArgs,
    ) -> &ExecutionResult {
        let result = ExecuteRequestBuilder::versioned_contract_call_by_hash(
            account_hash,
            contract_hash,
            None,
            entry_point,
            args,
        )
        .build();

        self.execute(result)
    }

    fn execute(&mut self, result: ExecuteRequest) -> &ExecutionResult {
        self.builder.exec(result).commit();
        let result = self.builder.last_exec_result();

        match result {
            ExecutionResult::Success { .. } => result,
            ExecutionResult::Failure { error, .. } => {
                panic!("{}", error)
            }
        }
    }

    pub(crate) fn unpack<T: CLTyped + FromBytes>(&self, value: Result<StoredValue, String>) -> T {
        value
            .expect("should be a value.")
            .as_cl_value()
            .expect("should be cl value.")
            .clone()
            .into_t::<T>()
            .expect("should typed")
    }

    fn make_deploy_request(
        wasm: &str,
        args: RuntimeArgs,
        account_hash: AccountHash,
    ) -> ExecuteRequest {
        // The test framework checks for compiled Wasm files in '<current working dir>/wasm'.  Paths
        // relative to the current working dir (e.g. 'wasm/contract.wasm') can also be used, as can
        // absolute paths.
        let session_code = PathBuf::from(wasm);

        let deploy_item = DeployItemBuilder::new()
            .with_empty_payment_bytes(runtime_args! {
                ARG_AMOUNT => *DEFAULT_PAYMENT
            })
            .with_session_code(session_code, args)
            .with_authorization_keys(&[account_hash])
            .with_address(account_hash)
            .build();

        ExecuteRequestBuilder::from_deploy_item(deploy_item).build()
    }
}
