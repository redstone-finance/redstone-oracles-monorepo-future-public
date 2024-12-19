use crate::test_helpers::{
    env::{
        helpers::{convert_payload, make_feed_ids, make_signers},
        run_env::PriceAdapterRunEnv,
        run_mode::{
            RunMode,
            RunMode::{Get, Write},
        },
    },
    sample::sample::{Sample, SIGNERS},
};
use redstone::{helpers::iter_into::IterIntoOpt, network::specific::U256};

impl Sample {
    pub fn instantiate_price_adapter<PriceAdapter: PriceAdapterRunEnv>(&self) -> PriceAdapter {
        PriceAdapter::instantiate(
            1,
            make_signers(SIGNERS.into()),
            self.system_timestamp.into(),
        )
    }

    pub fn verify_written_values<PriceAdapter: PriceAdapterRunEnv>(
        &self,
        price_adapter: &mut PriceAdapter,
        override_feed_ids: Option<Vec<&str>>,
    ) {
        let feed_ids = override_feed_ids.unwrap_or(self.feed_ids());

        let values = price_adapter.read_prices(make_feed_ids(feed_ids.clone()));
        let timestamp = price_adapter.read_timestamp(Some(feed_ids.get(0).unwrap()));

        self.verify_results(feed_ids, values.iter_into_opt(), timestamp);
    }

    pub fn test_write_prices<PriceAdapter: PriceAdapterRunEnv>(
        &self,
        price_adapter: &mut PriceAdapter,
        override_feed_ids: Option<Vec<&str>>,
    ) {
        self.test_process_payload(Write, price_adapter, override_feed_ids.clone());
        self.verify_written_values(price_adapter, override_feed_ids);
        price_adapter.increase_time();
    }

    pub fn test_get_prices<PriceAdapter: PriceAdapterRunEnv>(
        &self,
        price_adapter: &mut PriceAdapter,
        override_feed_ids: Option<Vec<&str>>,
    ) {
        self.test_process_payload(Get, price_adapter, override_feed_ids);
    }

    fn test_process_payload<PriceAdapter: PriceAdapterRunEnv>(
        &self,
        run_mode: RunMode,
        price_adapter: &mut PriceAdapter,
        override_feed_ids: Option<Vec<&str>>,
    ) {
        let feed_ids = override_feed_ids.clone().unwrap_or(self.feed_ids());
        let (timestamp, values) = price_adapter.process_payload(
            run_mode,
            convert_payload(self.content),
            make_feed_ids(feed_ids.clone()),
            self.system_timestamp,
        );

        self.verify_results(feed_ids, values.iter_into_opt(), timestamp);
    }

    pub fn feed_ids(&self) -> Vec<&str> {
        self.values.keys().map(|feed_id| feed_id.as_str()).collect()
    }

    pub fn verify_results(&self, feed_ids: Vec<&str>, values: Vec<Option<U256>>, timestamp: u64) {
        assert_eq!(self.timestamp, timestamp);
        assert_eq!(
            values,
            feed_ids
                .iter()
                .map(|&feed_id| self.values.get(feed_id).cloned())
                .collect::<Vec<Option<U256>>>()
        );
    }
}
