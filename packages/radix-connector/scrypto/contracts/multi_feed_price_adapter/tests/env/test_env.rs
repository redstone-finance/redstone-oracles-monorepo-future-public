use common::{
    test_helpers::{
        env::{helpers::make_feed_ids, run_env::PriceAdapterRunEnv, run_mode::RunMode},
        into_t::IntoT,
    },
    types::*,
};
use multi_feed_price_adapter::multi_feed_price_adapter::multi_feed_price_adapter_test::MultiFeedPriceAdapter;
use scrypto::{prelude::U256, time::Instant};
use scrypto_test::{
    environment::TestEnvironment,
    ledger_simulator::CompileProfile::Fast,
    prelude::{InMemorySubstateDatabase, PackageFactory},
    this_package,
};

pub(crate) struct MultiFeedPriceAdapterTestEnv {
    env: TestEnvironment<InMemorySubstateDatabase>,
    price_adapter: MultiFeedPriceAdapter,
}

impl PriceAdapterRunEnv for MultiFeedPriceAdapterTestEnv {
    type State = ();

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

        let price_adapter = MultiFeedPriceAdapter::instantiate_with_mock_timestamp(
            unique_signer_count,
            signers,
            timestamp,
            package_address,
            &mut env,
        )
        .unwrap();

        Self { env, price_adapter }
    }

    fn state(&self) -> Self::State {}

    fn read_timestamp(&mut self, feed_id: Option<&str>) -> u64 {
        let feed_ids = make_feed_ids(vec![feed_id.unwrap()]);

        self.price_adapter
            .read_price_data(feed_ids, &mut self.env)
            .unwrap()
            .first()
            .unwrap()
            .timestamp
    }

    fn read_prices(&mut self, feed_ids: FeedIds) -> Vec<U256> {
        self.price_adapter
            .read_prices_raw(feed_ids, &mut self.env)
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
                .get_prices_raw(feed_ids, payload, &mut self.env),
            RunMode::Write => self
                .price_adapter
                .write_prices_raw(feed_ids, payload, &mut self.env),
        }
        .unwrap();

        (timestamp, values.into_t())
    }

    fn increase_time(&mut self) {
        let ct = self.env.get_current_time().seconds_since_unix_epoch;
        self.env.set_current_time(Instant::new(ct + 1));
    }
}
