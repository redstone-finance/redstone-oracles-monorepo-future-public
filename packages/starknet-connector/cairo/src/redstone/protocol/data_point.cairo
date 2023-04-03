from starkware.cairo.common.serialize import serialize_word
from starkware.cairo.common.math import assert_nn
from starkware.cairo.common.alloc import alloc

from redstone.utils.array import (
    Array,
    array_slice_tail,
    array_slice_number,
    array_to_number,
    array_to_string,
)
from redstone.protocol.constants import DATA_FEED_ID_BS

struct DataPoint {
    feed_id: felt,
    value: felt,
}

struct DataPointArray {
    ptr: DataPoint*,
    len: felt,
}

func get_data_points{range_check_ptr}(arr: Array, value_size: felt, count: felt) -> DataPointArray {
    alloc_locals;

    assert_nn(count);
    assert_nn(value_size - 1);

    let (ptr: DataPoint*) = alloc();
    local res: DataPointArray = DataPointArray(ptr=ptr, len=count);

    _get_data_points(arr=arr, value_size=value_size, count=count, res=res);
    return res;
}

func _get_data_points{range_check_ptr}(
    arr: Array, value_size: felt, count: felt, res: DataPointArray
) {
    alloc_locals;

    if (count == 0) {
        return ();
    }

    let (value_rest, value) = array_slice_number(arr=arr, len=value_size);
    let (feed_id_rest, feed_id_arr) = array_slice_tail(arr=value_rest, len=DATA_FEED_ID_BS);

    let feed_id = array_to_string(feed_id_arr);
    local dp: DataPoint = DataPoint(feed_id=feed_id, value=value);
    assert res.ptr[count - 1] = dp;

    return _get_data_points(arr=feed_id_rest, value_size=value_size, count=count - 1, res=res);
}

func data_point_array_index{range_check_ptr}(arr: DataPointArray, feed_id: felt) -> felt {
    return _data_point_array_index(arr=arr, feed_id=feed_id, index=0);
}

func _data_point_array_index{range_check_ptr}(
    arr: DataPointArray, feed_id: felt, index: felt
) -> felt {
    if (index == arr.len) {
        return -1;
    }

    let dp = arr.ptr[index];

    if (dp.feed_id == feed_id) {
        return index;
    }

    return _data_point_array_index(arr=arr, feed_id=feed_id, index=index + 1);
}

func serialize_data_point_array{output_ptr: felt*, range_check_ptr}(
    arr: DataPointArray, index: felt
) {
    if (index == arr.len) {
        return ();
    }

    serialize_word(index);
    serialize_data_point(arr.ptr[index]);

    return serialize_data_point_array(arr=arr, index=index + 1);
}

func serialize_data_point{output_ptr: felt*, range_check_ptr}(dp: DataPoint) {
    serialize_word(dp.feed_id);
    serialize_word(dp.value);

    return ();
}
