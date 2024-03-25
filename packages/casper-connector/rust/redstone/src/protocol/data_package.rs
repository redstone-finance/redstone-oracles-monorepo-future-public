use crate::{
    crypto::recover::recover_address,
    network::as_str::AsHexStr,
    protocol::{
        constants::{
            DATA_FEED_ID_BS, DATA_POINTS_COUNT_BS, DATA_POINT_VALUE_BYTE_SIZE_BS, SIGNATURE_BS,
            TIMESTAMP_BS,
        },
        data_point::{trim_data_points, DataPoint},
    },
    utils::trim::Trim,
};
use std::fmt::{Debug, Formatter};

#[derive(Clone, PartialEq, Eq)]
pub(crate) struct DataPackage {
    pub(crate) signer_address: Vec<u8>,
    pub(crate) timestamp: u64,
    pub(crate) data_points: Vec<DataPoint>,
}

pub(crate) fn trim_data_packages(payload: &mut Vec<u8>, count: usize) -> Vec<DataPackage> {
    let mut data_packages = Vec::new();

    for _ in 0..count {
        let data_package = trim_data_package(payload);
        data_packages.push(data_package);
    }

    data_packages
}

fn trim_data_package(payload: &mut Vec<u8>) -> DataPackage {
    let signature = payload.trim_end(SIGNATURE_BS);
    let mut tmp = payload.clone();

    let data_point_count = payload.trim_end(DATA_POINTS_COUNT_BS);
    let value_size = payload.trim_end(DATA_POINT_VALUE_BYTE_SIZE_BS);
    let timestamp = payload.trim_end(TIMESTAMP_BS);
    let size = data_point_count * (value_size + DATA_FEED_ID_BS)
        + DATA_POINT_VALUE_BYTE_SIZE_BS
        + TIMESTAMP_BS
        + DATA_POINTS_COUNT_BS;

    let signable_bytes = tmp.trim_end(size);
    let signer_address = recover_address(signable_bytes, signature);

    let data_points = trim_data_points(payload, data_point_count, value_size);

    DataPackage {
        data_points,
        timestamp,
        signer_address,
    }
}

impl Debug for DataPackage {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "DataPackage {{\n   signer_address: 0x{}, timestamp: {},\n   data_points: {:?}\n}}",
            self.signer_address.as_hex_str(),
            self.timestamp,
            self.data_points
        )
    }
}

#[cfg(feature = "helpers")]
#[cfg(test)]
mod tests {
    use crate::{
        helpers::hex::hex_to_bytes,
        network::specific::{FromBytesRepr, U256},
        protocol::{
            constants::{
                DATA_FEED_ID_BS, DATA_POINTS_COUNT_BS, DATA_POINT_VALUE_BYTE_SIZE_BS, SIGNATURE_BS,
                TIMESTAMP_BS,
            },
            data_package::{trim_data_package, trim_data_packages, DataPackage},
            data_point::DataPoint,
        },
    };

    const DATA_PACKAGE_BYTES_1: &str = "4554480000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000360cafc94e018d79bf0ba00000002000000151afa8c5c3caf6004b42c0fb17723e524f993b9ecbad3b9bce5ec74930fa436a3660e8edef10e96ee5f222de7ef5787c02ca467c0ec18daa2907b43ac20c63c11c";
    const DATA_PACKAGE_BYTES_2: &str = "4554480000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000360cdd851e018d79bf0ba000000020000001473fd9dc72e6814a7de719b403cf4c9eba08934a643fd0666c433b806b31e69904f2226ffd3c8ef75861b11b5e32a1fda4b1458e0da4605a772dfba2a812f3ee1b";

    const SIGNER_ADDRESS_1: &str = "1ea62d73edf8ac05dfcea1a34b9796e937a29eff";
    const SIGNER_ADDRESS_2: &str = "109b4a318a4f5ddcbca6349b45f881b4137deafb";

    const VALUE_1: u128 = 232141080910;
    const VALUE_2: u128 = 232144078110;

    const DATA_PACKAGE_SIZE: usize = 32
        + DATA_FEED_ID_BS
        + DATA_POINT_VALUE_BYTE_SIZE_BS
        + TIMESTAMP_BS
        + SIGNATURE_BS
        + DATA_POINTS_COUNT_BS;

    #[test]
    fn test_trim_data_packages() {
        test_trim_data_packages_of(2, "");
        test_trim_data_packages_of(0, "");
        test_trim_data_packages_of(1, "");
    }

    #[test]
    fn test_trim_data_packages_with_prefix() {
        let prefix = "da4687f1914a1c";

        test_trim_data_packages_of(2, prefix);
    }

    #[test]
    fn test_trim_data_packages_single() {
        let mut bytes = hex_to_bytes(DATA_PACKAGE_BYTES_1.into());
        let data_packages = trim_data_packages(&mut bytes, 1);
        assert_eq!(data_packages.len(), 1);
        assert_eq!(bytes, Vec::<u8>::new());

        verify_data_package(data_packages[0].clone(), VALUE_1, SIGNER_ADDRESS_1);
    }

    fn test_trim_data_packages_of(count: usize, prefix: &str) {
        let input: Vec<u8> =
            hex_to_bytes((prefix.to_owned() + DATA_PACKAGE_BYTES_1) + DATA_PACKAGE_BYTES_2);
        let mut bytes = input.clone();
        let data_packages = trim_data_packages(&mut bytes, count);

        assert_eq!(data_packages.len(), count);
        assert_eq!(
            bytes.as_slice(),
            &input[..input.len() - count * DATA_PACKAGE_SIZE]
        );

        let values = &[VALUE_2, VALUE_1];
        let signers = &[SIGNER_ADDRESS_2, SIGNER_ADDRESS_1];

        for i in 0..count {
            verify_data_package(data_packages[i].clone(), values[i], signers[i]);
        }
    }

    #[should_panic(expected = "index out of bounds")]
    #[test]
    fn test_trim_data_packages_bigger_number() {
        test_trim_data_packages_of(3, "");
    }

    #[test]
    fn test_trim_data_package() {
        test_trim_data_package_of(DATA_PACKAGE_BYTES_1, VALUE_1, SIGNER_ADDRESS_1);
        test_trim_data_package_of(DATA_PACKAGE_BYTES_2, VALUE_2, SIGNER_ADDRESS_2);
    }

    #[test]
    fn test_trim_data_package_with_prefix() {
        test_trim_data_package_of(
            &("da4687f1914a1c".to_owned() + DATA_PACKAGE_BYTES_1),
            VALUE_1,
            SIGNER_ADDRESS_1,
        );
        test_trim_data_package_of(
            &("da4687f1914a1c".to_owned() + DATA_PACKAGE_BYTES_2),
            VALUE_2,
            SIGNER_ADDRESS_2,
        );
    }

    #[should_panic]
    #[test]
    fn test_trim_data_package_signature_only() {
        test_trim_data_package_of(
            &DATA_PACKAGE_BYTES_1[(DATA_PACKAGE_BYTES_1.len() - 2 * SIGNATURE_BS)..],
            0,
            "",
        );
    }

    #[should_panic]
    #[test]
    fn test_trim_data_package_shorter() {
        test_trim_data_package_of(
            &DATA_PACKAGE_BYTES_1
                [(DATA_PACKAGE_BYTES_1.len() - 2 * (SIGNATURE_BS + DATA_POINTS_COUNT_BS))..],
            0,
            "",
        );
    }

    fn test_trim_data_package_of(bytes_str: &str, expected_value: u128, signer_address: &str) {
        let mut bytes: Vec<u8> = hex_to_bytes(bytes_str.into());
        let result = trim_data_package(&mut bytes);
        assert_eq!(
            bytes,
            hex_to_bytes(bytes_str[..bytes_str.len() - 2 * (DATA_PACKAGE_SIZE)].into())
        );

        verify_data_package(result, expected_value, signer_address);
    }

    fn verify_data_package(result: DataPackage, expected_value: u128, signer_address: &str) {
        let data_package = DataPackage {
            data_points: vec![DataPoint {
                feed_id: U256::from_bytes_repr(hex_to_bytes(DATA_PACKAGE_BYTES_1[..6].into())),
                value: U256::from(expected_value),
            }],
            timestamp: 1707144580000,
            signer_address: hex_to_bytes(signer_address.into()),
        };

        assert_eq!(result, data_package);
    }
}
