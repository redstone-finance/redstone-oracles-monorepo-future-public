use redstone::{
    helpers::iter_into::{IterInto, IterIntoOpt},
    network::specific::U256,
};
use redstone_casper::contracts::run_mode::RunMode::{Get, Write};

use crate::core::{run_env::RunEnv, sample::Sample};

impl Sample {
    pub(crate) fn env_test_write_prices(
        &self,
        env: &mut RunEnv,
        override_feed_ids: Option<Vec<&str>>,
    ) {
        env.price_adapter_process_payload(
            Write,
            override_feed_ids.clone().unwrap_or(self.feed_ids()),
            self.read_bytes(),
            self.system_timestamp.into(),
        );

        self.env_verify_values(env, override_feed_ids);
    }

    pub(crate) fn env_test_get_prices(
        &self,
        env: &mut RunEnv,
        override_feed_ids: Option<Vec<&str>>,
        sample_to_verify: &Sample,
    ) {
        let feed_ids = override_feed_ids.clone().unwrap_or(self.feed_ids());
        env.price_adapter_process_payload(
            Get,
            feed_ids,
            self.read_bytes(),
            self.system_timestamp.into(),
        );

        sample_to_verify.env_verify_values(env, override_feed_ids);
    }

    pub(crate) fn env_verify_values(&self, env: &mut RunEnv, override_feed_ids: Option<Vec<&str>>) {
        let feed_ids = override_feed_ids.unwrap_or(self.feed_ids());
        let values: Vec<U256> = feed_ids
            .iter()
            .map(|&feed_id| env.price_adapter_read_price(feed_id))
            .collect();

        let timestamp = env.price_adapter_read_timestamp();

        self.verify_results(feed_ids.iter_into(), values.iter_into_opt(), timestamp);
    }
}
