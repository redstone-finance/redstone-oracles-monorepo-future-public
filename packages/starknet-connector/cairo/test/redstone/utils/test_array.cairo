%lang starknet

from redstone.utils.array import (
    Array,
    array_new,
    array_min,
    array_index,
    array_trunc,
    array_join,
    array_to_number,
    array_slice_number,
    ARRAY_UNKNOWN_INDEX,
)

@external
func test_array_new{syscall_ptr: felt*, range_check_ptr}() {
    let arr = first_array();
    assert arr.len = 5;

    return ();
}

@external
func test_array_min{syscall_ptr: felt*, range_check_ptr}() {
    let arr = second_array();
    let min_value = array_min(arr);
    assert min_value = 3;
    return ();
}

@external
func test_array_index{syscall_ptr: felt*, range_check_ptr}() {
    alloc_locals;

    let arr = first_array();
    let index = array_index(arr, key=2);
    assert index = 2;

    let index = array_index(arr, key=0);
    assert index = 3;

    let index = array_index(arr, key=4);
    assert index = ARRAY_UNKNOWN_INDEX;

    return ();
}

@external
func test_array_join{syscall_ptr: felt*, range_check_ptr}() {
    alloc_locals;

    let arr = first_array();
    let join = second_array();

    let res = array_join(arr, join);

    assert res.len = 8;

    return ();
}

@external
func test_array_trunc{syscall_ptr: felt*, range_check_ptr}() {
    let arr = first_array();
    let trunc = array_trunc(arr);
    assert trunc.len = 3;

    return ();
}

@external
func test_array_to_number{syscall_ptr: felt*, range_check_ptr}() {
    let arr = first_array();
    let number = array_to_number(arr);
    assert number = 12901810176;

    return ();
}

@external
func test_array_slice_number{syscall_ptr: felt*, range_check_ptr}() {
    let arr = first_array();
    let (head, number) = array_slice_number(arr, 3);
    assert number = 131072;
    assert head.len = 2;

    let (head, number) = array_slice_number(head, 2);
    assert number = 769;
    assert head.len = 0;

    return ();
}

func first_array{range_check_ptr}() -> Array {
    let r = array_new(len=5);

    assert r.ptr[0] = 3;
    assert r.ptr[1] = 1;
    assert r.ptr[2] = 2;
    assert r.ptr[3] = 0;
    assert r.ptr[4] = 0;

    return r;
}

func second_array{range_check_ptr}() -> Array {
    let r = array_new(len=3);

    assert r.ptr[0] = 5;
    assert r.ptr[1] = 3;
    assert r.ptr[2] = 4;

    return r;
}
