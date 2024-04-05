use core::array::ArrayTrait;
use core::option::OptionTrait;
use redstone::config::Config;
use redstone::config_validation::ValidableTrait;
use redstone::constants::{
    DATA_FEED_ID_BS, DATA_PACKAGES_COUNT_BS, DATA_POINT_VALUE_BYTE_SIZE_BS, DATA_POINTS_COUNT_BS,
    REDSTONE_MARKER, REDSTONE_MARKER_BS, SIGNATURE_BS, TIMESTAMP_BS, UNSIGNED_METADATA_BYTE_SIZE_BS
};
use redstone::number_convertible_array::NumberConvertibleArrayTrait;
use redstone::numbers::Felt252Div;
use redstone::signature::{get_signature_from_bytes, RedstoneSignature};
use redstone::sliceable_array::SliceableArrayTrait;

#[derive(Copy, Drop)]
pub(crate) struct Payload {
    pub(crate) data_packages: @Array<DataPackage>
}

#[derive(Drop, Copy)]
pub(crate) struct DataPoint {
    pub(crate) value: felt252,
    // TODO: change felt252 to u256
    pub(crate) feed_id: felt252,
}

#[derive(Drop, Copy)]
pub(crate) struct DataPackage {
    pub(crate) signature: RedstoneSignature,
    pub(crate) timestamp: felt252,
    pub(crate) data_points: @Array<DataPoint>,
    pub(crate) signable_bytes: @Array<u8>,
    pub(crate) index: usize
}

pub(crate) fn get_payload_from_bytes(arr: Array<u8>, validator: Config) -> Payload {
    let marker_slice = arr.slice_number(REDSTONE_MARKER_BS);

    let data_package_count_slice = marker_slice
        .head
        .slice_number_offset(DATA_PACKAGES_COUNT_BS, UNSIGNED_METADATA_BYTE_SIZE_BS);

    let mut data_packages: Array<DataPackage> = Default::default();

    slice_data_packages(
        arr: data_package_count_slice.head,
        :validator,
        count: data_package_count_slice.number,
        ref acc: data_packages
    );

    Payload { data_packages: @data_packages }
}

fn slice_data_packages(
    arr: @Array<u8>, validator: Config, count: felt252, ref acc: Array<DataPackage>
) {
    if (count == 0) {
        return ();
    }

    let signature_slice = arr.slice_tail(SIGNATURE_BS);
    let data_point_count_slice = signature_slice.head.slice_number(DATA_POINTS_COUNT_BS);
    let value_size_slice = data_point_count_slice.head.slice_number(DATA_POINT_VALUE_BYTE_SIZE_BS);

    let value_size = value_size_slice.number.try_into().unwrap();
    let data_point_count = data_point_count_slice.number.try_into().unwrap();
    let data_points_array_size = data_point_count * (value_size + DATA_FEED_ID_BS);

    let timestamp_slice = value_size_slice.head.slice_number(TIMESTAMP_BS);
    let timestamp = timestamp_slice.number;

    validator.validate_timestamp(index: acc.len(), timestamp: timestamp / 1000);
    let data_points_slice = timestamp_slice.head.slice_tail(data_points_array_size);

    let signature = get_signature_from_bytes(signature_slice.tail);
    let signable_bytes = signature_slice
        .head
        .slice_tail(
            data_points_array_size
                + DATA_POINTS_COUNT_BS
                + DATA_POINT_VALUE_BYTE_SIZE_BS
                + TIMESTAMP_BS
        )
        .tail;

    let mut data_points: Array<DataPoint> = Default::default();
    slice_data_points(timestamp_slice.head, value_size, data_point_count, ref data_points);

    let data_package = DataPackage {
        timestamp, index: acc.len(), signature, data_points: @data_points, signable_bytes
    };

    acc.append(data_package);

    slice_data_packages(arr: data_points_slice.head, :validator, count: count - 1, ref :acc);
}

fn slice_data_points(arr: @Array<u8>, value_size: usize, count: usize, ref acc: Array<DataPoint>) {
    if (count == 0_usize) {
        return ();
    }

    let value_slice = arr.slice_number(value_size);
    let feed_id_slice = value_slice.head.slice_tail(value_size);

    let data_point = DataPoint {
        value: value_slice.number, feed_id: feed_id_slice.tail.to_string_number()
    };

    acc.append(data_point);

    slice_data_points(feed_id_slice.head, value_size, count - 1_usize, ref acc)
}
