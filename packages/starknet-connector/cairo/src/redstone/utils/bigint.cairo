from starkware.cairo.common.alloc import alloc
from starkware.cairo.common.math import unsigned_div_rem, assert_nn
from starkware.cairo.common.uint256 import Uint256
from starkware.cairo.common.cairo_secp.bigint import BigInt3, bigint_to_uint256
from starkware.cairo.common.cairo_secp.constants import BASE
from starkware.cairo.common.serialize import serialize_word

from redstone.utils.array import Array, array_new, array_slice_tail, array_to_number, array_join
from redstone.utils.shortint import shortint_to_bytes

// signature from 32-length array of bytes
func bigint_from_array{range_check_ptr}(arr: Array) -> BigInt3 {
    alloc_locals;

    assert arr.len = 32;

    let (a12_arr, a0_arr) = array_slice_tail(arr, 11);
    let (a2_arr, a1_arr) = array_slice_tail(a12_arr, 10);

    let a2 = array_to_number(a2_arr);
    let a1 = array_to_number(a1_arr);
    let a0 = array_to_number(a0_arr);

    return bigint_from_limbs(a2=a2, a1=a1, a0=a0);
}

// a2 = 11 highest bytes, a1 = 10 middle bytes, a0 = 11 lowest bytes
func bigint_from_limbs{range_check_ptr}(a2: felt, a1: felt, a0: felt) -> BigInt3 {
    alloc_locals;

    let (q0, d0) = unsigned_div_rem(a0, BASE);
    let (d2, r2) = unsigned_div_rem(a2, 16);
    let d1 = q0 + 4 * a1 + BASE * (r2 / 16);

    local res: BigInt3 = BigInt3(d0=d0, d1=d1, d2=d2);

    return res;
}

func bigint_to_bytes{range_check_ptr}(num: BigInt3) -> Array {
    alloc_locals;

    let (num_256) = bigint_to_uint256(num);
    let high_bytes = shortint_to_bytes(num_256.high);
    let low_bytes = shortint_to_bytes(num_256.low);

    let res = array_join(high_bytes, low_bytes);

    return res;
}

func serialize_bigint{output_ptr: felt*, range_check_ptr}(num: BigInt3) {
    let (num_256) = bigint_to_uint256(num);

    serialize_word(num_256.high);
    serialize_word(num_256.low);

    return ();
}
