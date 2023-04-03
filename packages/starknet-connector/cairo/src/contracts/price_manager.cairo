%lang starknet

from starkware.cairo.common.cairo_builtins import HashBuiltin, BitwiseBuiltin
from starkware.cairo.common.math import assert_nn, assert_le, assert_in_range, unsigned_div_rem

from starkware.starknet.common.syscalls import get_block_timestamp, get_block_number

from redstone.utils.array import Array, array_new

from contracts.ownable import write_owner, assert_owner
from contracts.prices_core import read_prices, write_prices as core_write_prices, timestamp

from contracts.core import (
    unique_signer_count_threshold,
    signer_address,
    signer_address_len,
    get_aggregated_values,
    write_addresses,
)

@storage_var
func round_number() -> (res: felt) {
}

@storage_var
func block_number() -> (res: felt) {
}

@storage_var
func block_timestamp() -> (res: felt) {
}

@constructor
func constructor{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    owner_address: felt, signer_count_threshold: felt, addresses_len: felt, addresses: felt*
) {
    assert_nn(signer_count_threshold);
    assert_in_range(signer_count_threshold, 0, addresses_len + 1);

    write_owner(owner_address);
    unique_signer_count_threshold.write(signer_count_threshold);
    signer_address_len.write(addresses_len);
    write_addresses(ptr=addresses, len=addresses_len, index=0);

    return ();
}

@view
func read_price{
    syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, bitwise_ptr: BitwiseBuiltin*, range_check_ptr
}(feed_id: felt) -> (value: felt) {
    alloc_locals;

    let requested_feed_ids = array_new(len=1);
    assert requested_feed_ids.ptr[0] = feed_id;

    let values = read_prices(feed_ids_len=1, feed_ids=requested_feed_ids.ptr);

    return (value=values.ptr[0]);
}

@view
func read_round_data{
    syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, bitwise_ptr: BitwiseBuiltin*, range_check_ptr
}() -> (payload_timestamp: felt, round: felt, block_number: felt, block_timestamp: felt) {
    let (payload_timestamp) = timestamp.read();
    let (rnd) = round_number.read();
    let (block_ts) = block_timestamp.read();
    let (block_num) = block_number.read();

    return (
        payload_timestamp=payload_timestamp,
        round=rnd,
        block_number=block_num,
        block_timestamp=block_ts,
    );
}

@external
func write_prices{
    syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, bitwise_ptr: BitwiseBuiltin*, range_check_ptr
}(
    rndNumber: felt,
    feed_ids_len: felt,
    feed_ids: felt*,
    payload_data_len: felt,
    payload_data: felt*,
) {
    alloc_locals;

    let (savedround) = round_number.read();  // Cannot evaluate ap-based or complex references: ['saved_round']
    with_attr error_message(
            "The increased by 1 saved round#: #{savedround} doesn't convene with the passed round#: {rndNumber}") {
        assert rndNumber = savedround + 1;
    }

    let requested_feed_ids = Array(ptr=feed_ids, len=feed_ids_len);

    let (values, ts) = get_aggregated_values(
        requested_feed_ids=requested_feed_ids,
        payload_data_len=payload_data_len,
        payload_data=payload_data,
    );

    let (savedtimestamp) = timestamp.read();  // Cannot evaluate ap-based or complex references: ['saved_timestamp']
    with_attr error_message(
            "The saved timestamp: #{savedtimestamp} is greater than the data_package's timestamp: {ts}") {
        assert_le(savedtimestamp, ts);
    }

    let (block_ts) = get_block_timestamp();
    let (block_num) = get_block_number();

    let (package_ts_normalized, _) = unsigned_div_rem(ts, 1000);

    timestamp.write(package_ts_normalized);
    round_number.write(rndNumber);
    block_timestamp.write(block_ts);
    block_number.write(block_num);

    return core_write_prices(feed_ids=requested_feed_ids, values=values, index=0);
}
