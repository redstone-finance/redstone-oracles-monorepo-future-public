from starkware.cairo.common.serialize import serialize_word
from starkware.cairo.common.math import assert_nn
from starkware.cairo.common.math_cmp import is_not_zero
from starkware.cairo.common.alloc import alloc
from starkware.cairo.common.usort import usort

const ARRAY_UNKNOWN_INDEX = -1;

struct Array {
    ptr: felt*,
    len: felt,
}

func array_new{range_check_ptr}(len: felt) -> Array {
    alloc_locals;

    assert_nn(len);

    let (ptr) = alloc();
    local array: Array = Array(ptr=ptr, len=len);

    return array;
}

func array_slice_tail_offset{range_check_ptr}(arr: Array, len: felt, tail_offset: felt) -> (
    head: Array, tail: Array
) {
    alloc_locals;

    assert_nn(len);

    let head_len = arr.len - tail_offset - len;
    assert_nn(head_len);

    local head: Array = Array(ptr=arr.ptr, len=head_len);
    local tail: Array = Array(ptr=arr.ptr + head_len, len=len);

    return (head=head, tail=tail);
}

func array_slice_tail{range_check_ptr}(arr: Array, len: felt) -> (head: Array, tail: Array) {
    return array_slice_tail_offset(arr=arr, len=len, tail_offset=0);
}

func array_slice_number{range_check_ptr}(arr: Array, len: felt) -> (head: Array, number: felt) {
    alloc_locals;

    let (head, tail) = array_slice_tail_offset(arr=arr, len=len, tail_offset=0);
    let number = array_to_number(tail);

    return (head=head, number=number);
}

func array_to_number{range_check_ptr}(arr: Array) -> felt {
    alloc_locals;

    assert_nn(arr.len);

    return _array_to_number(ptr=arr.ptr, len=arr.len, mlt=1, acc=0);
}

func _array_to_number{range_check_ptr}(ptr: felt*, len: felt, mlt: felt, acc: felt) -> felt {
    if (len == 0) {
        return acc;
    }

    let last = [ptr + len - 1];

    return _array_to_number(ptr=ptr, len=len - 1, mlt=mlt * 256, acc=acc + mlt * last);
}

func array_to_string{range_check_ptr}(arr: Array) -> felt {
    let trunc_arr = array_trunc(arr);
    return array_to_number(trunc_arr);
}

func array_trunc{range_check_ptr}(arr: Array) -> Array {
    alloc_locals;

    assert_nn(arr.len);

    let (res_ptr: Array*) = alloc();
    assert res_ptr.ptr = arr.ptr;

    _array_trunc(ptr=arr.ptr, len=arr.len, last_is_zero=1, res=res_ptr);

    return [res_ptr];
}

func _array_trunc{range_check_ptr}(ptr: felt*, len: felt, last_is_zero: felt, res: Array*) {
    alloc_locals;

    if ((len + 1) * last_is_zero == 0) {
        assert res.len = len + 1;

        return ();
    }

    let last = ptr[len - 1];
    let isnt_zero = is_not_zero(last);

    return _array_trunc(ptr=ptr, len=len - 1, last_is_zero=1 - isnt_zero, res=res);
}

func array_join{range_check_ptr}(arr: Array, join: Array) -> Array {
    alloc_locals;

    let (ptr) = alloc();
    local res: Array = Array(ptr=arr.ptr, len=arr.len + join.len);

    array_join_rec(offset=arr.len, join=join, index=0, res=res);

    return res;
}

func array_join_rec(offset: felt, join: Array, index: felt, res: Array) {
    if (offset + index == res.len) {
        return ();
    }

    assert res.ptr[offset + index] = join.ptr[index];

    return array_join_rec(offset=offset, join=join, index=index + 1, res=res);
}

func array_index{range_check_ptr}(arr: Array, key: felt) -> felt {
    return _array_index(arr=arr, key=key, index=0);
}

func _array_index{range_check_ptr}(arr: Array, key: felt, index: felt) -> felt {
    if (index == arr.len) {
        return -1;
    }

    if (arr.ptr[index] == key) {
        return index;
    }

    return _array_index(arr=arr, key=key, index=index + 1);
}

func array_sort{range_check_ptr}(arr: Array) -> Array {
    alloc_locals;

    let (output_len, output, multiplicities) = usort(input_len=arr.len, input=arr.ptr);

    let (ptr) = alloc();
    let res = Array(ptr=ptr, len=arr.len);

    _array_sort(
        arr=output,
        multiplicities=multiplicities,
        mult_index_acc=ARRAY_UNKNOWN_INDEX,
        mult_left_acc=0,
        index=0,
        res=res,
    );

    return res;
}

func _array_sort{range_check_ptr}(
    arr: felt*,
    multiplicities: felt*,
    mult_index_acc: felt,
    mult_left_acc: felt,
    index: felt,
    res: Array,
) {
    alloc_locals;

    if (index == res.len) {
        return ();
    }

    local mult_index;
    local mult_left;
    if (mult_left_acc == 0) {
        assert mult_index = mult_index_acc + 1;
        assert mult_left = multiplicities[mult_index];
    } else {
        assert mult_index = mult_index_acc;
        assert mult_left = mult_left_acc;
    }

    assert res.ptr[index] = arr[mult_index];

    return _array_sort(
        arr=arr,
        multiplicities=multiplicities,
        mult_index_acc=mult_index,
        mult_left_acc=mult_left - 1,
        index=index + 1,
        res=res,
    );
}

func array_min{range_check_ptr}(arr: Array) -> felt {
    let sorted_array = array_sort(arr=arr);
    let min_value = sorted_array.ptr[0];

    return min_value;
}

func serialize_array{output_ptr: felt*, range_check_ptr}(arr: Array, index: felt) {
    if (index == arr.len) {
        return ();
    }

    serialize_word(arr.ptr[index]);

    return serialize_array(arr=arr, index=index + 1);
}
