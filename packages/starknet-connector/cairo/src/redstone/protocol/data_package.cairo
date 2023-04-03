from starkware.cairo.common.serialize import serialize_word, array_rfold
from starkware.cairo.common.math import assert_nn
from starkware.cairo.common.alloc import alloc
from starkware.cairo.common.registers import get_label_location

from redstone.utils.dict import Dict

from redstone.utils.array import (
    Array,
    array_slice_tail_offset,
    array_slice_tail,
    array_slice_number,
)
from redstone.protocol.data_point import (
    DataPointArray,
    DataPoint,
    serialize_data_point_array,
    get_data_points,
)
from redstone.crypto.signature import Signature, get_signature, serialize_signature
from redstone.protocol.constants import (
    DATA_FEED_ID_BS,
    DATA_POINTS_COUNT_BS,
    DATA_POINT_VALUE_BYTE_SIZE_BS,
    TIMESTAMP_BS,
    SIGNATURE_BS,
)

struct DataPackage {
    timestamp: felt,
    signable_arr: Array,
    signature: Signature,
    data_points: DataPointArray,
}

struct DataPackageArray {
    ptr: DataPackage*,
    len: felt,
}

func get_data_packages{range_check_ptr}(arr: Array, count: felt) -> DataPackageArray {
    alloc_locals;

    assert_nn(count);

    let (ptr: DataPackage*) = alloc();
    local res: DataPackageArray = DataPackageArray(ptr=ptr, len=count);

    _get_data_packages(arr=arr, count=count, res=res);

    return res;
}

func _get_data_packages{range_check_ptr}(arr: Array, count: felt, res: DataPackageArray) {
    alloc_locals;

    if (count == 0) {
        return ();
    }

    let (signature_rest, signature_arr) = array_slice_tail(arr=arr, len=SIGNATURE_BS);
    let signature = get_signature(bytes_arr=signature_arr);

    let (datapoint_count_rest, datapoint_count) = array_slice_number(
        arr=signature_rest, len=DATA_POINTS_COUNT_BS
    );
    let (data_point_value_size_rest, data_point_value_size) = array_slice_number(
        arr=datapoint_count_rest, len=DATA_POINT_VALUE_BYTE_SIZE_BS
    );
    let (timestamp_rest, timestamp) = array_slice_number(
        arr=data_point_value_size_rest, len=TIMESTAMP_BS
    );

    let (data_points_rest, data_points_arr) = array_slice_tail(
        arr=timestamp_rest, len=datapoint_count * (data_point_value_size + DATA_FEED_ID_BS)
    );
    let data_points = get_data_points(
        arr=data_points_arr, value_size=data_point_value_size, count=datapoint_count
    );
    assert data_points.len = datapoint_count;

    let signable_arr_len = DATA_POINTS_COUNT_BS + DATA_POINT_VALUE_BYTE_SIZE_BS + TIMESTAMP_BS +
        datapoint_count * (data_point_value_size + DATA_FEED_ID_BS);
    let (_, signable_arr) = array_slice_tail(arr=signature_rest, len=signable_arr_len);

    local package: DataPackage = DataPackage(
        timestamp=timestamp, signable_arr=signable_arr, signature=signature, data_points=data_points
    );

    assert res.ptr[count - 1] = package;

    return _get_data_packages(arr=data_points_rest, count=count - 1, res=res);
}

func serialize_data_package_array{output_ptr: felt*, range_check_ptr}(
    arr: DataPackageArray, index: felt
) {
    if (index == arr.len) {
        return ();
    }

    serialize_word(index);
    serialize_data_package(arr.ptr + index * DataPackage.SIZE);

    return serialize_data_package_array(arr=arr, index=index + 1);
}

func serialize_data_package{output_ptr: felt*, range_check_ptr}(package: DataPackage*) {
    serialize_word(package.timestamp);
    serialize_signature(package.signature);
    serialize_data_point_array(package.data_points, 0);

    return ();
}
