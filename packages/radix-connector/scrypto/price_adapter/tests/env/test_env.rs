use crate::env::{run_env::PriceAdapterRunEnv, run_mode::RunMode};
use price_adapter::{
    price_adapter::price_adapter_test::{PriceAdapter, PriceAdapterState},
    types::*,
};
use redstone::network::specific::U256;
use scrypto::time::Instant;
use scrypto_test::{
    environment::TestEnvironment,
    ledger_simulator::CompileProfile::Fast,
    prelude::{InMemorySubstateDatabase, PackageFactory},
    this_package,
};

pub(crate) struct PriceAdapterTestEnv {
    env: TestEnvironment<InMemorySubstateDatabase>,
    price_adapter: PriceAdapter,
}

impl PriceAdapterRunEnv for PriceAdapterTestEnv {
    fn instantiate(unique_signer_count: u8, signers: Signers, timestamp: Option<u64>) -> Self {
        let mut env = TestEnvironment::new();

        if timestamp.is_some() {
            env.set_current_time(Instant::new(timestamp.unwrap() as i64));
            let epoch = env.get_current_epoch();
            env.set_current_epoch(epoch.next().unwrap());
            env.set_current_time(Instant::new(timestamp.unwrap() as i64));
        }

        let package_address =
            PackageFactory::compile_and_publish(this_package!(), &mut env, Fast).unwrap();

        let price_adapter = PriceAdapter::instantiate_with_mock_timestamp(
            unique_signer_count,
            signers,
            timestamp,
            package_address,
            &mut env,
        )
        .unwrap();

        Self { env, price_adapter }
    }

    fn state(&self) -> PriceAdapterState {
        todo!()
    }

    fn read_timestamp(&mut self) -> u64 {
        self.price_adapter.read_timestamp(&mut self.env).unwrap()
    }

    fn read_prices(&mut self, feed_ids: FeedIds) -> Vec<U256> {
        self.price_adapter
            .read_prices(feed_ids, &mut self.env)
            .unwrap()
            .into_t()
    }

    fn process_payload(
        &mut self,
        run_mode: RunMode,
        payload: Payload,
        feed_ids: FeedIds,
        _timestamp: u64,
    ) -> (u64, Vec<U256>) {
        let (timestamp, values) = match run_mode {
            RunMode::Get => self
                .price_adapter
                .get_prices(feed_ids, payload, &mut self.env),
            RunMode::Write => self
                .price_adapter
                .write_prices(feed_ids, payload, &mut self.env),
        }
        .unwrap();

        (timestamp, values.into_t())
    }

    fn increase_time(&mut self) {
        let ct = self.env.get_current_time().seconds_since_unix_epoch;
        self.env.set_current_time(Instant::new(ct + 1));
    }
}

pub(crate) trait IntoT<T> {
    fn into_t(self) -> T;
}

impl IntoT<Vec<U256>> for Vec<U256Digits> {
    fn into_t(self) -> Vec<U256> {
        self.iter().map(|&d| U256::from_digits(d)).collect()
    }
}
