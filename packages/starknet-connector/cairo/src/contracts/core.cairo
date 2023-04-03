%lang starknet

from starkware.cairo.common.cairo_builtins import HashBuiltin, BitwiseBuiltin
from starkware.cairo.common.math import assert_nn, assert_le, assert_in_range

from starkware.starknet.common.syscalls import get_block_timestamp

from redstone.protocol.payload import Payload, get_price

from redstone.utils.array import Array, array_new

from redstone.core.config import Config
from redstone.core.processor import process_payload as redstone_process_payload

@storage_var
func unique_signer_count_threshold() -> (res: felt) {
}

@storage_var
func signer_address(index: felt) -> (res: felt) {
}

@storage_var
func signer_address_len() -> (res: felt) {
}

func get_aggregated_values{
    syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, bitwise_ptr: BitwiseBuiltin*, range_check_ptr
}(requested_feed_ids: Array, payload_data_len: felt, payload_data: felt*) -> (
    aggregated: Array, timestamp: felt
) {
    alloc_locals;

    let (block_ts) = get_block_timestamp();
    let allowed_signer_addresses = get_allowed_signer_addresses();
    let (signer_count_threshold) = unique_signer_count_threshold.read();

    local config: Config = Config(
        block_ts=block_ts,
        allowed_signer_addresses=allowed_signer_addresses,
        requested_feed_ids=requested_feed_ids,
        signer_count_threshold=signer_count_threshold,
    );

    let (payload, _, aggregated) = redstone_process_payload(
        data_ptr=payload_data, data_len=payload_data_len, config=config
    );

    let timestamp = payload.min_timestamp;

    return (aggregated=aggregated, timestamp=timestamp);
}

func get_allowed_signer_addresses{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    ) -> Array {
    alloc_locals;

    let (addresses_len) = signer_address_len.read();
    let arr = array_new(len=addresses_len);

    _get_allowed_signer_addresses(index=0, res=arr);

    return arr;
}

func _get_allowed_signer_addresses{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    index: felt, res: Array
) {
    if (index == res.len) {
        return ();
    }

    let (address) = signer_address.read(index);
    assert res.ptr[index] = address;

    return _get_allowed_signer_addresses(index=index + 1, res=res);
}

func write_addresses{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    ptr: felt*, len: felt, index: felt
) {
    if (len == index) {
        return ();
    }

    signer_address.write(index, ptr[index]);

    return write_addresses(ptr=ptr, len=len, index=index + 1);
}
