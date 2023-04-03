from starkware.cairo.common.cairo_secp.bigint import BigInt3
from starkware.cairo.common.serialize import serialize_word

from redstone.utils.array import Array, array_slice_tail_offset
from redstone.protocol.constants import SIGNATURE_BS
from redstone.utils.bigint import bigint_from_array, serialize_bigint

struct Signature {
    r: BigInt3,
    s: BigInt3,
    v: felt,
}

func get_signature{range_check_ptr}(bytes_arr: Array) -> Signature {
    alloc_locals;

    assert bytes_arr.len = SIGNATURE_BS;

    local signature: Signature;

    let (r_arr, s_arr) = array_slice_tail_offset(bytes_arr, 32, 1);
    let r = bigint_from_array(r_arr);
    assert signature.r = r;

    let s = bigint_from_array(s_arr);
    assert signature.s = s;

    assert signature.v = [bytes_arr.ptr + 64];

    return signature;
}

func serialize_signature{output_ptr: felt*, range_check_ptr}(sig: Signature) {
    alloc_locals;

    serialize_bigint(sig.r);
    serialize_bigint(sig.s);
    serialize_word(sig.v);

    return ();
}
