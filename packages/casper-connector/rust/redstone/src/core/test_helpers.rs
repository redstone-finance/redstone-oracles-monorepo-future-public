use crate::{
    core::config::Config,
    helpers::hex::{hex_to_bytes, make_feed_id, make_feed_ids},
    protocol::{data_package::DataPackage, data_point::DataPoint},
};

pub(crate) const TEST_BLOCK_TIMESTAMP: u64 = 2000000000000;

pub(crate) const TEST_SIGNER_ADDRESS_1: &str = "1ea62d73edF8ac05dfcea1a34b9796e937a29eFF";
pub(crate) const TEST_SIGNER_ADDRESS_2: &str = "109b4a318a4f5ddcbca6349b45f881b4137deafb";

pub(crate) const ETH: &str = "ETH";
pub(crate) const BTC: &str = "BTC";
pub(crate) const AVAX: &str = "AVAX";

impl Config {
    pub(crate) fn test() -> Self {
        Self::test_with_feed_ids(vec!["ETH", "BTC"])
    }

    pub(crate) fn test_with_feed_ids(feed_ids: Vec<&str>) -> Self {
        Self {
            signer_count_threshold: 2,
            signers: vec![
                hex_to_bytes(TEST_SIGNER_ADDRESS_1.into()).into(),
                hex_to_bytes(TEST_SIGNER_ADDRESS_2.into()).into(),
            ],
            feed_ids: make_feed_ids(feed_ids),
            block_timestamp: TEST_BLOCK_TIMESTAMP,
        }
    }
}

impl DataPackage {
    pub(crate) fn test(
        feed_id: &str,
        value: u128,
        signer_address: &str,
        timestamp: Option<u64>,
    ) -> Self {
        DataPackage {
            signer_address: hex_to_bytes(signer_address.into()),
            timestamp: timestamp.unwrap_or(TEST_BLOCK_TIMESTAMP),
            data_points: vec![DataPoint {
                feed_id: make_feed_id(feed_id),
                value: value.into(),
            }],
        }
    }
}
