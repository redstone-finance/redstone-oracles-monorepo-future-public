use crate::core::sample::Sample;
use redstone::{
    helpers::{
        hex::make_feed_ids,
        iter_into::{IterInto, IterIntoOpt},
    },
    network::casper::contracts::computed_value::ComputedValue,
};

impl Sample {
    pub(crate) fn verify_computed_value(
        &self,
        result: &ComputedValue,
        overwrite_feed_ids_to_check: Option<Vec<&str>>,
    ) {
        let (timestamp, feed_ids, values) = result;
        let feed_ids_to_check = overwrite_feed_ids_to_check.unwrap_or(vec!["ETH", "BTC"]);
        assert_eq!(feed_ids.clone(), make_feed_ids(feed_ids_to_check.clone()));

        self.verify_results(
            feed_ids_to_check.iter_into(),
            values.iter_into_opt(),
            *timestamp,
        );
    }
}
