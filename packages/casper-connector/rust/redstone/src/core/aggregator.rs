use crate::{
    core::{config::Config, validator::Validator},
    network::specific::U256,
    print_debug,
    protocol::data_package::DataPackage,
    utils::median::Median,
};

type Matrix = Vec<Vec<Option<U256>>>;

/// Aggregates values from a collection of data packages according to the provided configuration.
///
/// This function takes a configuration and a vector of data packages, constructs a matrix of values
/// and their corresponding signers, and then aggregates these values based on the aggregation logic
/// defined in the provided configuration. The aggregation strategy could vary, for example, by taking
/// an average of the values, selecting the median, or applying a custom algorithm defined within the
/// `aggregate_matrix` function.
///
/// The primary purpose of this function is to consolidate data from multiple sources into a coherent
/// and singular value set that adheres to the criteria specified in the `Config`.
///
/// # Arguments
///
/// * `config` - A `Config` instance containing settings and parameters used to guide the aggregation process.
/// * `data_packages` - A vector of `DataPackage` instances, each representing a set of values and associated
///   metadata collected from various sources or signers.
///
/// # Returns
///
/// Returns a `Vec<U256>`, which is a vector of aggregated values resulting from applying the aggregation
/// logic to the input data packages as per the specified configuration. Each `U256` value in the vector
/// represents an aggregated result derived from the corresponding data packages.
///
/// # Note
///
/// This function is internal to the crate (`pub(crate)`) and not exposed as part of the public API. It is
/// designed to be used by other components within the same crate that require value aggregation functionality.
pub(crate) fn aggregate_values(config: Config, data_packages: Vec<DataPackage>) -> Vec<U256> {
    aggregate_matrix(make_value_signer_matrix(&config, data_packages), config)
}

fn aggregate_matrix(matrix: Matrix, config: Config) -> Vec<U256> {
    matrix
        .iter()
        .enumerate()
        .map(|(index, values)| {
            config
                .validate_signer_count_threshold(index, values)
                .median()
        })
        .collect()
}

fn make_value_signer_matrix(config: &Config, data_packages: Vec<DataPackage>) -> Matrix {
    let mut matrix = vec![vec![None; config.signers.len()]; config.feed_ids.len()];

    data_packages.iter().for_each(|data_package| {
        if let Some(signer_index) = config.signer_index(&data_package.signer_address) {
            data_package.data_points.iter().for_each(|data_point| {
                if let Some(feed_index) = config.feed_index(data_point.feed_id) {
                    matrix[feed_index][signer_index] = data_point.value.into()
                }
            })
        }
    });

    print_debug!("{:?}", matrix);

    matrix
}

#[cfg(feature = "helpers")]
#[cfg(test)]
mod aggregate_matrix_tests {
    use crate::{
        core::{aggregator::aggregate_matrix, config::Config},
        helpers::iter_into::{IterInto, IterIntoOpt, OptIterIntoOpt},
    };

    #[test]
    fn test_aggregate_matrix() {
        let matrix = vec![
            vec![11u8, 13].iter_into_opt(),
            vec![21u8, 23].iter_into_opt(),
        ];

        for signer_count_threshold in 0..Config::test().signers.len() + 1 {
            let mut config = Config::test();
            config.signer_count_threshold = signer_count_threshold as u8;

            let result = aggregate_matrix(matrix.clone(), config);

            assert_eq!(result, vec![12u8, 22].iter_into());
        }
    }

    #[test]
    fn test_aggregate_matrix_smaller_threshold_missing_one_value() {
        let mut config = Config::test();
        config.signer_count_threshold = 1;

        let matrix = vec![
            vec![11u8, 13].iter_into_opt(),
            vec![21u8.into(), None].opt_iter_into_opt(),
        ];

        let result = aggregate_matrix(matrix, config);

        assert_eq!(result, vec![12u8, 21].iter_into());
    }

    #[should_panic(expected = "Array is empty")]
    #[test]
    fn test_aggregate_matrix_smaller_threshold_missing_whole_feed() {
        let mut config = Config::test();
        config.signer_count_threshold = 0;

        let matrix = vec![vec![11u8, 13].iter_into_opt(), vec![None; 2]];

        aggregate_matrix(matrix, config);
    }

    #[should_panic(expected = "Insufficient signer count 1 for #0 (ETH)")]
    #[test]
    fn test_aggregate_matrix_missing_one_value() {
        let matrix = vec![
            vec![21u8.into(), None].opt_iter_into_opt(),
            vec![11u8, 12].iter_into_opt(),
        ];

        aggregate_matrix(matrix, Config::test());
    }

    #[should_panic(expected = "Insufficient signer count 0 for #1 (BTC)")]
    #[test]
    fn test_aggregate_matrix_missing_whole_feed() {
        let matrix = vec![vec![11u8, 13].iter_into_opt(), vec![None; 2]];

        aggregate_matrix(matrix, Config::test());
    }
}

#[cfg(feature = "helpers")]
#[cfg(test)]
mod make_value_signer_matrix {
    use crate::{
        core::{
            aggregator::{make_value_signer_matrix, Matrix},
            config::Config,
            test_helpers::{AVAX, BTC, ETH, TEST_SIGNER_ADDRESS_1, TEST_SIGNER_ADDRESS_2},
        },
        helpers::iter_into::IterInto,
        network::specific::U256,
        protocol::data_package::DataPackage,
    };

    #[test]
    fn test_make_value_signer_matrix_empty() {
        let config = Config::test();

        test_make_value_signer_matrix_of(
            vec![],
            vec![vec![None; config.signers.len()]; config.feed_ids.len()],
        );
    }

    #[test]
    fn test_make_value_signer_matrix_exact() {
        let data_packages = vec![
            DataPackage::test(ETH, 11, TEST_SIGNER_ADDRESS_1, None),
            DataPackage::test(ETH, 12, TEST_SIGNER_ADDRESS_2, None),
            DataPackage::test(BTC, 22, TEST_SIGNER_ADDRESS_2, None),
            DataPackage::test(BTC, 21, TEST_SIGNER_ADDRESS_1, None),
        ];

        test_make_value_signer_matrix_of(
            data_packages,
            vec![vec![11, 12].iter_into(), vec![21, 22].iter_into()],
        );
    }

    #[test]
    fn test_make_value_signer_matrix_greater() {
        let data_packages = vec![
            DataPackage::test(ETH, 11, TEST_SIGNER_ADDRESS_1, None),
            DataPackage::test(ETH, 12, TEST_SIGNER_ADDRESS_2, None),
            DataPackage::test(BTC, 22, TEST_SIGNER_ADDRESS_2, None),
            DataPackage::test(BTC, 21, TEST_SIGNER_ADDRESS_1, None),
            DataPackage::test(AVAX, 31, TEST_SIGNER_ADDRESS_1, None),
            DataPackage::test(AVAX, 32, TEST_SIGNER_ADDRESS_2, None),
        ];

        test_make_value_signer_matrix_of(
            data_packages,
            vec![vec![11, 12].iter_into(), vec![21, 22].iter_into()],
        );
    }

    #[test]
    fn test_make_value_signer_matrix_smaller() {
        let data_packages = vec![
            DataPackage::test(ETH, 11, TEST_SIGNER_ADDRESS_1, None),
            DataPackage::test(ETH, 12, TEST_SIGNER_ADDRESS_2, None),
        ];

        test_make_value_signer_matrix_of(
            data_packages,
            vec![vec![11, 12].iter_into(), vec![None; 2]],
        );
    }

    #[test]
    fn test_make_value_signer_matrix_diagonal() {
        let data_packages = vec![
            DataPackage::test(BTC, 22, TEST_SIGNER_ADDRESS_2, None),
            DataPackage::test(ETH, 11, TEST_SIGNER_ADDRESS_1, None),
        ];

        test_make_value_signer_matrix_of(
            data_packages,
            vec![vec![11.into(), None], vec![None, 22.into()]],
        );
    }

    #[test]
    fn test_make_value_signer_matrix_repetitions() {
        let data_packages = vec![
            DataPackage::test(BTC, 21, TEST_SIGNER_ADDRESS_1, None),
            DataPackage::test(BTC, 22, TEST_SIGNER_ADDRESS_2, None),
            DataPackage::test(BTC, 202, TEST_SIGNER_ADDRESS_2, None),
            DataPackage::test(ETH, 11, TEST_SIGNER_ADDRESS_1, None),
            DataPackage::test(ETH, 101, TEST_SIGNER_ADDRESS_1, None),
            DataPackage::test(ETH, 12, TEST_SIGNER_ADDRESS_2, None),
        ];

        test_make_value_signer_matrix_of(
            data_packages,
            vec![vec![101, 12].iter_into(), vec![21, 202].iter_into()],
        );
    }

    #[test]
    fn test_make_value_signer_matrix_all_wrong() {
        let config = Config::test();

        let data_packages = vec![
            DataPackage::test(AVAX, 32, TEST_SIGNER_ADDRESS_2, None),
            DataPackage::test(AVAX, 31, TEST_SIGNER_ADDRESS_1, None),
        ];

        test_make_value_signer_matrix_of(
            data_packages,
            vec![vec![None; config.signers.len()]; config.feed_ids.len()],
        );
    }

    #[test]
    fn test_make_value_signer_matrix_mix() {
        let data_packages = vec![
            DataPackage::test(ETH, 11, TEST_SIGNER_ADDRESS_1, None),
            DataPackage::test(ETH, 12, TEST_SIGNER_ADDRESS_2, None),
            DataPackage::test(AVAX, 32, TEST_SIGNER_ADDRESS_2, None),
            DataPackage::test(AVAX, 31, TEST_SIGNER_ADDRESS_1, None),
        ];

        test_make_value_signer_matrix_of(
            data_packages,
            vec![vec![11, 12].iter_into(), vec![None; 2]],
        );
    }

    fn test_make_value_signer_matrix_of(
        data_packages: Vec<DataPackage>,
        expected_values: Vec<Vec<Option<u128>>>,
    ) {
        let config = &Config::test();
        let result = make_value_signer_matrix(config, data_packages);

        let expected_matrix: Matrix = expected_values
            .iter()
            .map(|row| {
                (row.iter()
                    .map(|&value| value.map(U256::from))
                    .collect::<Vec<_>>())
                .iter_into() as Vec<Option<U256>>
            })
            .collect();

        assert_eq!(result, expected_matrix)
    }
}
