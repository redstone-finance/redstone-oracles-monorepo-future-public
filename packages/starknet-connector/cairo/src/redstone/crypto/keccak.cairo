from starkware.cairo.common.keccak import unsafe_keccak
from starkware.cairo.common.math import unsigned_div_rem, split_felt
from starkware.cairo.common.alloc import alloc
from starkware.cairo.common.cairo_secp.bigint import BigInt3, uint256_to_bigint
from starkware.cairo.common.uint256 import Uint256
from starkware.cairo.common.cairo_builtins import BitwiseBuiltin

from starkware.cairo.common.cairo_keccak.keccak import finalize_keccak

from redstone.utils.array import Array, array_new, array_to_number

const KECCAK_WORD_SIZE = 16;

// Calculates the keccak hash for the given byte array
func keccak{range_check_ptr}(bytes_arr: Array) -> BigInt3 {
    alloc_locals;

    let words = keccak_words(bytes_arr);
    let (low, high) = unsafe_keccak(words.ptr, bytes_arr.len);
    local hash_256: Uint256 = Uint256(low=low, high=high);
    let (res) = uint256_to_bigint(hash_256);

    return res;
}

// For Array of bytes returns an array of 16-byte length words
func keccak_words{range_check_ptr}(arr: Array) -> Array {
    alloc_locals;

    let (q, _) = unsigned_div_rem(arr.len, KECCAK_WORD_SIZE);
    let res = array_new(len=q + 1);

    _keccak_words(arr=arr, count=0, res=res);

    return res;
}

func _keccak_words{range_check_ptr}(arr: Array, count: felt, res: Array) {
    alloc_locals;

    let (q, _) = unsigned_div_rem(arr.len, KECCAK_WORD_SIZE);
    if (q == 0) {
        let num = array_to_number(arr);
        assert res.ptr[count] = num;

        return ();
    }

    tempvar num_arr: Array = Array(ptr=arr.ptr, len=KECCAK_WORD_SIZE);
    let num = array_to_number(num_arr);

    assert res.ptr[count] = num;

    local arr_rec: Array = Array(ptr=arr.ptr + KECCAK_WORD_SIZE, len=arr.len - KECCAK_WORD_SIZE);

    return _keccak_words(arr=arr_rec, count=count + 1, res=res);
}

func keccak_finalize{range_check_ptr, bitwise_ptr: BitwiseBuiltin*}(
    keccak_ptr_start: felt*, keccak_ptr_end: felt*
) {
    finalize_keccak(keccak_ptr_start=keccak_ptr_start, keccak_ptr_end=keccak_ptr_end);

    return ();
}
