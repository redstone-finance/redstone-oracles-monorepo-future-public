library protocol;

dep utils/bytes;
dep crypto;
dep utils/from_bytes;

use std::{bytes::*, logging::log, u256::U256, vec::Vec, vm::evm::evm_address::EvmAddress};
use bytes::*;
use crypto::recover_signer_address;
use from_bytes::FromBytes;

const REDSTONE_MARKER = [0x00, 0x00, 0x02, 0xed, 0x57, 0x01, 0x1e, 0x00, 0x00];
const REDSTONE_MARKER_BS = 9;
const UNSIGNED_METADATA_BYTE_SIZE_BS = 3;
const DATA_PACKAGES_COUNT_BS = 2;
const SIGNATURE_BS = 65;
const DATA_POINTS_COUNT_BS = 3;
const DATA_POINT_VALUE_BYTE_SIZE_BS = 4;
const TIMESTAMP_BS = 6;
const DATA_FEED_ID_BS = 32;

pub struct Payload {
    data_packages: Vec<DataPackage>,
}

pub struct DataPackage {
    timestamp: u64,
    signer_address: EvmAddress,
    data_points: Vec<DataPoint>,
}

struct DataPoint {
    feed_id: U256,
    value: U256,
}

// 13107200 + byte_index
pub const WRONG_REDSTONE_MARKER = 0xc80000;

impl FromBytes for DataPoint {
    fn from_bytes(bytes: Bytes) -> DataPoint {
        let (feed_id_bytes, value_bytes) = bytes.slice_tail(bytes.len - DATA_FEED_ID_BS);

        let data_point = DataPoint {
            feed_id: U256::from_bytes_truncated(feed_id_bytes),
            value: U256::from_bytes(value_bytes),
        };

        return data_point;
    }
}

impl FromBytes for Payload {
    fn from_bytes(bytes: Bytes) -> Payload {
        let (marker_rest, marker_bytes) = bytes.slice_tail(REDSTONE_MARKER_BS);

        let mut i = 0;
        while (i < REDSTONE_MARKER_BS) {
            if (marker_bytes.get(i).unwrap() != REDSTONE_MARKER[i]) {
                revert(WRONG_REDSTONE_MARKER + i);
            }

            i += 1;
        }

        let (unsigned_metadata_rest, unsigned_metadata_size) = marker_rest.slice_number(UNSIGNED_METADATA_BYTE_SIZE_BS);
        let (data_package_count_rest, data_package_count) = unsigned_metadata_rest.slice_number_offset(DATA_PACKAGES_COUNT_BS, unsigned_metadata_size);

        let mut i = 0;
        let mut data_packages = Vec::with_capacity(data_package_count);
        let mut bytes_rest = data_package_count_rest;

        while (i < data_package_count) {
            let (data_package, bytes_taken) = make_data_package(bytes_rest);
            data_packages.push(data_package);

            let (head, _) = bytes_rest.slice_tail(bytes_taken);
            bytes_rest = head;

            i += 1;
        }

        let payload = Payload { data_packages };

        return payload;
    }
}

fn make_data_package(bytes: Bytes) -> (DataPackage, u64) {
    let (signature_rest, signature_bytes) = bytes.slice_tail(SIGNATURE_BS);
    let (data_point_count_rest, data_point_count) = signature_rest.slice_number(DATA_POINTS_COUNT_BS);
    let (data_point_value_size_rest, data_point_value_size) = data_point_count_rest.slice_number(DATA_POINT_VALUE_BYTE_SIZE_BS);
    let (timestamp_rest, timestamp) = data_point_value_size_rest.slice_number(TIMESTAMP_BS);
    let (_, data_points_bytes) = timestamp_rest.slice_tail(data_point_count * (data_point_value_size + DATA_FEED_ID_BS));

    let mut data_points = Vec::with_capacity(data_point_count);
    let mut i = 0;
    let mut rest = data_points_bytes;
    while (i < data_point_count) {
        let (head, dp_bytes) = rest.slice_tail(DATA_FEED_ID_BS + data_point_value_size);
        rest = head;
        data_points.push(DataPoint::from_bytes(dp_bytes));

        i += 1;
    }
    let signable_bytes_len = DATA_POINTS_COUNT_BS + DATA_POINT_VALUE_BYTE_SIZE_BS + TIMESTAMP_BS + data_point_count * (data_point_value_size + DATA_FEED_ID_BS);
    let (_, signable_bytes) = signature_rest.slice_tail(signable_bytes_len);

    let signer_address = recover_signer_address(signature_bytes, signable_bytes);

    let data_package = DataPackage {
        signer_address,
        timestamp,
        data_points,
    };

    return (data_package, signable_bytes_len + SIGNATURE_BS);
}
