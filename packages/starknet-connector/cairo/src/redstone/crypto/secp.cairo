from starkware.cairo.common.alloc import alloc
from starkware.cairo.common.cairo_builtins import BitwiseBuiltin
from starkware.cairo.common.serialize import serialize_word
from starkware.cairo.common.uint256 import Uint256, uint256_and, SHIFT, ALL_ONES

from starkware.cairo.common.cairo_secp.bigint import BigInt3, bigint_to_uint256
from starkware.cairo.common.cairo_secp.ec import EcPoint
from starkware.cairo.common.cairo_secp.signature import (
    recover_public_key as secp_recover_public_key,
    public_key_point_to_eth_address,
)

from redstone.crypto.signature import Signature
from redstone.crypto.keccak import keccak

from redstone.utils.array import Array, array_join, serialize_array
from redstone.utils.bigint import serialize_bigint, bigint_to_bytes

func recover_address{range_check_ptr, bitwise_ptr: BitwiseBuiltin*, keccak_ptr: felt*}(
    signable_arr: Array, signature: Signature
) -> felt {
    alloc_locals;

    let key = recover_public_key(signable_arr, signature);
    let (address) = public_key_point_to_eth_address(key);

    return address;
}

func recover_public_key{range_check_ptr}(signable_arr: Array, signature: Signature) -> EcPoint {
    let message_hash = keccak(bytes_arr=signable_arr);

    let (key) = secp_recover_public_key(message_hash, signature.r, signature.s, signature.v - 27);

    return key;
}
