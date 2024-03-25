use crate::{
    core::{
        aggregator::aggregate_values, config::Config, processor_result::ProcessorResult,
        validator::Validator,
    },
    network::specific::Bytes,
    print_debug,
    protocol::payload::Payload,
};

/// The main processor of the RedStone payload.
///
///
/// # Arguments
///
/// * `config` - Configuration of the payload processing.
/// * `payload_bytes` - Network-specific byte-list of the payload to be processed.
pub fn process_payload(config: Config, payload_bytes: Bytes) -> ProcessorResult {
    #[allow(clippy::useless_conversion)]
    let mut bytes: Vec<u8> = payload_bytes.into();
    let payload = Payload::make(&mut bytes);
    print_debug!("{:?}", payload);

    make_processor_result(config, payload)
}

fn make_processor_result(config: Config, payload: Payload) -> ProcessorResult {
    let min_timestamp = payload
        .data_packages
        .iter()
        .enumerate()
        .map(|(index, dp)| config.validate_timestamp(index, dp.timestamp))
        .min()
        .unwrap();

    let values = aggregate_values(config, payload.data_packages);

    print_debug!("{} {:?}", min_timestamp, values);

    ProcessorResult {
        values,
        min_timestamp,
    }
}

#[cfg(feature = "helpers")]
#[cfg(test)]
mod tests {
    use crate::{
        core::{
            config::Config,
            processor::make_processor_result,
            processor_result::ProcessorResult,
            test_helpers::{
                BTC, ETH, TEST_BLOCK_TIMESTAMP, TEST_SIGNER_ADDRESS_1, TEST_SIGNER_ADDRESS_2,
            },
        },
        helpers::iter_into::IterInto,
        protocol::{data_package::DataPackage, payload::Payload},
    };

    #[test]
    fn test_make_processor_result() {
        let data_packages = vec![
            DataPackage::test(
                ETH,
                11,
                TEST_SIGNER_ADDRESS_1,
                (TEST_BLOCK_TIMESTAMP + 5).into(),
            ),
            DataPackage::test(
                ETH,
                13,
                TEST_SIGNER_ADDRESS_2,
                (TEST_BLOCK_TIMESTAMP + 3).into(),
            ),
            DataPackage::test(
                BTC,
                32,
                TEST_SIGNER_ADDRESS_2,
                (TEST_BLOCK_TIMESTAMP - 2).into(),
            ),
            DataPackage::test(
                BTC,
                31,
                TEST_SIGNER_ADDRESS_1,
                (TEST_BLOCK_TIMESTAMP + 400).into(),
            ),
        ];

        let result = make_processor_result(Config::test(), Payload { data_packages });

        assert_eq!(
            result,
            ProcessorResult {
                min_timestamp: TEST_BLOCK_TIMESTAMP - 2,
                values: vec![12u8, 31].iter_into()
            }
        );
    }
}
