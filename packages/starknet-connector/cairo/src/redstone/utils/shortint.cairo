from starkware.cairo.common.math import unsigned_div_rem, assert_nn

from redstone.utils.array import Array, array_new

// length of felt taken from uint256
const SHORTINT_SIZE_BYTES = 16;

func shortint_to_bytes{range_check_ptr}(num: felt) -> Array {
    alloc_locals;

    assert_nn(num);

    let res: Array = array_new(len=SHORTINT_SIZE_BYTES);
    _shortint_to_bytes(num=num, index=SHORTINT_SIZE_BYTES, res=res);

    return res;
}

func _shortint_to_bytes{range_check_ptr}(num: felt, index: felt, res: Array) {
    if (index == 0) {
        return ();
    }

    let (q, r) = unsigned_div_rem(num, 256);
    assert res.ptr[index - 1] = r;

    return _shortint_to_bytes(num=q, index=index - 1, res=res);
}
