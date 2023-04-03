from starkware.cairo.common.math import assert_nn
from starkware.cairo.common.serialize import serialize_word

from redstone.protocol.data_point import data_point_array_index
from redstone.protocol.data_package import (
    DataPackageArray,
    get_data_packages,
    serialize_data_package_array,
)
from redstone.utils.array import (
    Array,
    array_slice_tail_offset,
    array_slice_number,
    array_to_number,
    array_new,
    array_min,
)
from redstone.protocol.constants import (
    REDSTONE_MARKER,
    REDSTONE_MARKER_BS,
    UNSIGNED_METADATA_BYTE_SIZE_BS,
    DATA_PACKAGES_COUNT_BS,
)

struct Payload {
    data_packages: DataPackageArray,
    min_timestamp: felt,
}

func get_payload{range_check_ptr}(bytes_arr: Array) -> Payload {
    alloc_locals;

    let (redstone_marker_rest, redstone_marker) = array_slice_number(
        arr=bytes_arr, len=REDSTONE_MARKER_BS
    );
    assert redstone_marker = REDSTONE_MARKER;

    let (unsigned_metadata_size_rest, unsigned_metadata_size) = array_slice_number(
        arr=redstone_marker_rest, len=UNSIGNED_METADATA_BYTE_SIZE_BS
    );
    assert unsigned_metadata_size = 0;

    let (data_package_count_rest, data_package_count_arr) = array_slice_tail_offset(
        arr=unsigned_metadata_size_rest,
        len=DATA_PACKAGES_COUNT_BS,
        tail_offset=unsigned_metadata_size,
    );
    let data_package_count = array_to_number(arr=data_package_count_arr);

    let data_packages = get_data_packages(arr=data_package_count_rest, count=data_package_count);
    assert data_packages.len = data_package_count;

    let min_timestamp = get_min_timestamp(data_packages=data_packages);

    local payload: Payload = Payload(data_packages=data_packages, min_timestamp=min_timestamp);

    return payload;
}

func get_price{range_check_ptr}(payload: Payload, package_index: felt, feed_id: felt) -> felt {
    assert_nn(payload.data_packages.len - package_index);

    let package = payload.data_packages.ptr[package_index];
    let dp_index = data_point_array_index(arr=package.data_points, feed_id=feed_id);

    assert_nn(package.data_points.len - dp_index);
    let dp = package.data_points.ptr[dp_index];

    return dp.value;
}

func get_min_timestamp{range_check_ptr}(data_packages: DataPackageArray) -> felt {
    alloc_locals;

    let arr = array_new(len=data_packages.len);

    get_timestamps(arr=data_packages, index=0, res=arr);

    let min_timestamp = array_min(arr=arr);

    return min_timestamp;
}

func get_timestamps(arr: DataPackageArray, index: felt, res: Array) {
    if (index == arr.len) {
        return ();
    }

    assert res.ptr[index] = arr.ptr[index].timestamp;

    return get_timestamps(arr, index=index + 1, res=res);
}

func serialize_payload{output_ptr: felt*, range_check_ptr}(payload: Payload) {
    serialize_word(payload.min_timestamp);
    serialize_data_package_array(payload.data_packages, 0);

    return ();
}
