use crate::{
    core::config::Config,
    network::{
        assert::Assert,
        error::Error::{InsufficientSignerCount, TimestampTooFuture, TimestampTooOld},
        specific::U256,
    },
    protocol::constants::{MAX_TIMESTAMP_AHEAD_MS, MAX_TIMESTAMP_DELAY_MS},
    utils::filter::FilterSome,
};

/// A trait defining validation operations for data feeds and signers.
///
/// This trait specifies methods for validating aspects of data feeds and signers within a system that
/// requires data integrity and authenticity checks. Implementations of this trait are responsible for
/// defining the logic behind each validation step, ensuring that data conforms to expected rules and
/// conditions.
pub(crate) trait Validator {
    /// Retrieves the index of a given data feed.
    ///
    /// This method takes a `feed_id` representing the unique identifier of a data feed and
    /// returns an `Option<usize>` indicating the index of the feed within a collection of feeds.
    /// If the feed does not exist, `None` is returned.
    ///
    /// # Arguments
    ///
    /// * `feed_id`: `U256` - The unique identifier of the data feed.
    ///
    /// # Returns
    ///
    /// * `Option<usize>` - The index of the feed if it exists, or `None` if it does not.
    fn feed_index(&self, feed_id: U256) -> Option<usize>;

    /// Retrieves the index of a given signer.
    ///
    /// This method accepts a signer identifier in the form of a byte slice and returns an
    /// `Option<usize>` indicating the signer's index within a collection of signers. If the signer
    /// is not found, `None` is returned.
    ///
    /// # Arguments
    ///
    /// * `signer`: `&[u8]` - A byte slice representing the signer's identifier.
    ///
    /// # Returns
    ///
    /// * `Option<usize>` - The index of the signer if found, or `None` if not found.
    fn signer_index(&self, signer: &[u8]) -> Option<usize>;

    /// Validates the signer count threshold for a given index within a set of values.
    ///
    /// This method is responsible for ensuring that the number of valid signers meets or exceeds
    /// a specified threshold necessary for a set of data values to be considered valid. It returns
    /// a vector of `U256` if the values pass the validation, to be processed in other steps.
    ///
    /// # Arguments
    ///
    /// * `index`: `usize` - The index of the data value being validated.
    /// * `values`: `&[Option<U256>]` - A slice of optional `U256` values associated with the data.
    ///
    /// # Returns
    ///
    /// * `Vec<U256>` - A vector of `U256` values that meet the validation criteria.
    fn validate_signer_count_threshold(&self, index: usize, values: &[Option<U256>]) -> Vec<U256>;

    /// Validates the timestamp for a given index.
    ///
    /// This method checks whether a timestamp associated with a data value at a given index
    /// meets specific conditions (e.g., being within an acceptable time range). It returns
    /// the validated timestamp if it's valid, to be processed in other steps.
    ///
    /// # Arguments
    ///
    /// * `index`: `usize` - The index of the data value whose timestamp is being validated.
    /// * `timestamp`: `u64` - The timestamp to be validated.
    ///
    /// # Returns
    ///
    /// * `u64` - The validated timestamp.
    fn validate_timestamp(&self, index: usize, timestamp: u64) -> u64;
}

impl Validator for Config {
    #[inline]
    fn feed_index(&self, feed_id: U256) -> Option<usize> {
        self.feed_ids.iter().position(|&elt| elt == feed_id)
    }

    #[inline]
    fn signer_index(&self, signer: &[u8]) -> Option<usize> {
        self.signers
            .iter()
            .position(|elt| elt.to_ascii_lowercase() == signer.to_ascii_lowercase())
    }

    #[inline]
    fn validate_signer_count_threshold(&self, index: usize, values: &[Option<U256>]) -> Vec<U256> {
        values.filter_some().assert_or_revert(
            |x| (*x).len() >= self.signer_count_threshold.into(),
            #[allow(clippy::useless_conversion)]
            |val| InsufficientSignerCount(index, val.len(), self.feed_ids[index]),
        )
    }

    #[inline]
    fn validate_timestamp(&self, index: usize, timestamp: u64) -> u64 {
        timestamp.assert_or_revert(
            |&x| x + MAX_TIMESTAMP_DELAY_MS >= self.block_timestamp,
            |timestamp| TimestampTooOld(index, *timestamp),
        );

        timestamp.assert_or_revert(
            |&x| x <= self.block_timestamp + MAX_TIMESTAMP_AHEAD_MS,
            |timestamp| TimestampTooFuture(index, *timestamp),
        )
    }
}

#[cfg(feature = "helpers")]
#[cfg(test)]
mod tests {
    use crate::{
        core::{
            config::Config,
            test_helpers::{
                AVAX, BTC, ETH, TEST_BLOCK_TIMESTAMP, TEST_SIGNER_ADDRESS_1, TEST_SIGNER_ADDRESS_2,
            },
            validator::Validator,
        },
        helpers::{
            hex::{hex_to_bytes, make_feed_id},
            iter_into::{IterInto, IterIntoOpt, OptIterIntoOpt},
        },
        network::specific::U256,
        protocol::constants::{MAX_TIMESTAMP_AHEAD_MS, MAX_TIMESTAMP_DELAY_MS},
    };
    use itertools::Itertools;

    #[test]
    fn test_feed_index() {
        let config = Config::test();

        let eth_index = config.feed_index(make_feed_id(ETH));
        assert_eq!(eth_index, 0.into());

        let eth_index = config.feed_index(make_feed_id("778680")); //eth
        assert_eq!(eth_index, None);

        let btc_index = config.feed_index(make_feed_id(BTC));
        assert_eq!(btc_index, 1.into());

        let avax_index = config.feed_index(make_feed_id(AVAX));
        assert_eq!(avax_index, None);
    }

    #[test]
    fn test_signer_index() {
        let config = Config::test();
        let index = config.signer_index(&hex_to_bytes(TEST_SIGNER_ADDRESS_1.into()));
        assert_eq!(index, 0.into());

        let index = config.signer_index(&hex_to_bytes(TEST_SIGNER_ADDRESS_1.to_uppercase()));
        assert_eq!(index, 0.into());

        let index = config.signer_index(&hex_to_bytes(TEST_SIGNER_ADDRESS_2.into()));
        assert_eq!(index, 1.into());

        let index = config.signer_index(&hex_to_bytes(TEST_SIGNER_ADDRESS_2.replace('0', "1")));
        assert_eq!(index, None);
    }

    #[test]
    fn test_validate_timestamp() {
        let config = Config::test();

        config.validate_timestamp(0, TEST_BLOCK_TIMESTAMP);
        config.validate_timestamp(1, TEST_BLOCK_TIMESTAMP + 60000);
        config.validate_timestamp(2, TEST_BLOCK_TIMESTAMP + MAX_TIMESTAMP_AHEAD_MS);
        config.validate_timestamp(3, TEST_BLOCK_TIMESTAMP - MAX_TIMESTAMP_DELAY_MS);
        config.validate_timestamp(4, TEST_BLOCK_TIMESTAMP - 60000);
    }

    #[should_panic(expected = "Timestamp 2000000180001 is too future for #0")]
    #[test]
    fn test_validate_timestamp_too_future() {
        Config::test().validate_timestamp(0, TEST_BLOCK_TIMESTAMP + MAX_TIMESTAMP_AHEAD_MS + 1);
    }

    #[should_panic(expected = "Timestamp 1999999099999 is too old for #1")]
    #[test]
    fn test_validate_timestamp_too_old() {
        Config::test().validate_timestamp(1, TEST_BLOCK_TIMESTAMP - MAX_TIMESTAMP_DELAY_MS - 1);
    }

    #[should_panic(expected = "Timestamp 0 is too old for #2")]
    #[test]
    fn test_validate_timestamp_zero() {
        Config::test().validate_timestamp(2, 0);
    }

    #[should_panic(expected = "Timestamp 4000000000000 is too future for #3")]
    #[test]
    fn test_validate_timestamp_big() {
        Config::test().validate_timestamp(3, TEST_BLOCK_TIMESTAMP + TEST_BLOCK_TIMESTAMP);
    }

    #[should_panic(expected = "Timestamp 2000000000000 is too future for #4")]
    #[test]
    fn test_validate_timestamp_no_block_timestamp() {
        let mut config = Config::test();

        config.block_timestamp = 0;
        config.validate_timestamp(4, TEST_BLOCK_TIMESTAMP);
    }

    #[should_panic(expected = "Insufficient signer count 0 for #0 (ETH)")]
    #[test]
    fn test_validate_signer_count_threshold_empty_list() {
        Config::test().validate_signer_count_threshold(0, vec![].as_slice());
    }

    #[should_panic(expected = "Insufficient signer count 1 for #1 (BTC)")]
    #[test]
    fn test_validate_signer_count_threshold_shorter_list() {
        Config::test().validate_signer_count_threshold(1, vec![1u8].iter_into_opt().as_slice());
    }

    #[should_panic(expected = "Insufficient signer count 1 for #1 (BTC)")]
    #[test]
    fn test_validate_signer_count_threshold_list_with_nones() {
        Config::test().validate_signer_count_threshold(
            1,
            vec![None, 1u8.into(), None].opt_iter_into_opt().as_slice(),
        );
    }

    #[test]
    fn test_validate_signer_count_threshold_with_exact_size() {
        validate_with_all_permutations(vec![1u8, 2].iter_into_opt(), vec![1u8, 2].iter_into());
    }

    #[test]
    fn test_validate_signer_count_threshold_with_exact_signer_count() {
        validate_with_all_permutations(
            vec![None, 1u8.into(), None, 2.into()].opt_iter_into_opt(),
            vec![1u8, 2].iter_into(),
        );
    }

    #[test]
    fn test_validate_signer_count_threshold_with_larger_size() {
        validate_with_all_permutations(
            vec![
                1u8.into(),
                None,
                None,
                2.into(),
                3.into(),
                None,
                4.into(),
                None,
            ]
            .opt_iter_into_opt(),
            vec![1u8, 2, 3, 4].iter_into(),
        );
    }

    fn validate_with_all_permutations(numbers: Vec<Option<U256>>, expected_value: Vec<U256>) {
        let perms: Vec<Vec<_>> = numbers.iter().permutations(numbers.len()).collect();
        let mut config = Config::test();

        let result = config.validate_signer_count_threshold(0, &numbers);
        assert_eq!(result, expected_value);

        for threshold in 0..expected_value.len() + 1 {
            config.signer_count_threshold = threshold as u8;

            for (index, perm) in perms.iter().enumerate() {
                let p: Vec<_> = perm.iter().map(|&&v| v).collect();

                let result =
                    config.validate_signer_count_threshold(index % config.feed_ids.len(), &p);
                assert_eq!(result.len(), expected_value.len());
            }
        }
    }
}
