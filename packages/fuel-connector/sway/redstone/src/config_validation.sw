library config_validation;

dep protocol;
dep config;
dep validation;
dep utils/numbers;

use std::u256::U256;
use protocol::{DataPackage, Payload};
use config::Config;
use validation::*;
use numbers::*;

/// 655360000 + feed_index
pub const INSUFFICIENT_SIGNER_COUNT = 0x2710_0000;

/// 1310720000 + data_package_index
pub const SIGNER_NOT_RECOGNIZED = 0x4e20_0000;

trait Validation {
    fn validate_timestamps(self, payload: Payload);
    fn validate_signer_count(self, values: Vec<Vec<U256>>);
    fn validate_signer(self, data_package: DataPackage, index: u64) -> Option<u64>;
}

impl Validation for Config {
    fn validate_timestamps(self, payload: Payload) {
        let mut i = 0;
        while (i < payload.data_packages.len) {
            let timestamp = payload.data_packages.get(i).unwrap().timestamp / 1000;
            let block_timestamp = self.block_timestamp;

            validate_timestamp(i, timestamp, block_timestamp);

            i += 1;
        }
    }

    fn validate_signer_count(self, results: Vec<Vec<U256>>) {
        let mut i = 0;
        while (i < self.feed_ids.len) {
            let values = results.get(i).unwrap();
            if (values.len < self.signer_count_threshold) {
                log(values.len);
                revert(INSUFFICIENT_SIGNER_COUNT + i);
            }

            i += 1;
        }
    }

    fn validate_signer(self, data_package: DataPackage, index: u64) -> Option<u64> {
        let s = self.signer_index(data_package.signer_address.value);

        if s.is_none() {
            log(data_package.signer_address.value);
            // revert(SIGNER_NOT_RECOGNIZED + index);
        }

        return s;
    }
}

fn make_results() -> Vec<Vec<U256>> {
    let mut results = Vec::new();

    let mut set1 = Vec::new();
    set1.push(U256::from_u64(111));
    set1.push(U256::from_u64(777));

    let mut set2 = Vec::new();
    set2.push(U256::from_u64(444));
    set2.push(U256::from_u64(555));
    set2.push(U256::from_u64(666));

    let mut set3 = Vec::new();
    set3.push(U256::from_u64(222));
    set3.push(U256::from_u64(333));

    results.push(set1);
    results.push(set2);
    results.push(set3);

    return results;
}

fn make_config(signer_count_threshold: u64) -> Config {
    let mut feed_ids = Vec::new();
    feed_ids.push(U256::from_u64(0x444444));
    feed_ids.push(U256::from_u64(0x445566));
    feed_ids.push(U256::from_u64(0x556644));

    let config = Config {
        feed_ids: feed_ids,
        signers: Vec::new(),
        signer_count_threshold,
        block_timestamp: 0,
    };

    return config;
}
#[test]
fn test_validate_one_signer() {
    let results = make_results();
    let config = make_config(1);

    config.validate_signer_count(results);
}

#[test]
fn test_validate_two_signers() {
    let results = make_results();
    let config = make_config(2);

    config.validate_signer_count(results);
}

#[test(should_revert)]
fn test_validate_three_signers() {
    let results = make_results();
    let config = make_config(3);

    config.validate_signer_count(results);
}
