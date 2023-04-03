%lang starknet

from redstone.utils.array import array_new, array_min

@external
func test_array_new{syscall_ptr: felt*, range_check_ptr}() {
    let r = array_new(len=3);
    assert r.len = 3;

    assert r.ptr[0] = 1;
    assert r.ptr[1] = 2;
    assert r.ptr[2] = 3;

    return ();
}

@external
func test_array_min{syscall_ptr: felt*, range_check_ptr}() {
    let r = array_new(len=3);
    assert r.len = 3;

    assert r.ptr[0] = 3;
    assert r.ptr[1] = 1;
    assert r.ptr[2] = 2;

    let min_value = array_min(r);

    assert min_value = 1;

    return ();
}
