%lang starknet

from starkware.cairo.common.cairo_builtins import HashBuiltin, BitwiseBuiltin
from starkware.cairo.common.math import assert_le

from contracts.round import Round
from contracts.price_manager_interface import IPriceManager

@storage_var
func manager_contract_address() -> (res: felt) {
}

@storage_var
func feed_identifier() -> (res: felt) {
}

@constructor
func constructor{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    manager_address: felt, feed_id: felt
) {
    feed_identifier.write(feed_id);
    manager_contract_address.write(manager_address);

    return ();
}

@view
func latest_round_data{
    syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, bitwise_ptr: BitwiseBuiltin*, range_check_ptr
}() -> (round: Round) {
    alloc_locals;

    let (contract_address) = manager_contract_address.read();
    let (feed_id) = feed_identifier.read();

    let (price) = IPriceManager.read_price(contract_address=contract_address, feed_id=feed_id);
    let (payload_ts, round_id, block_number, block_ts) = IPriceManager.read_round_data(
        contract_address=contract_address
    );

    let round = Round(
        round_id=round_id,
        answer=price,
        block_num=block_number,
        started_at=payload_ts,
        updated_at=block_ts,
    );

    return (round=round);
}

@view
func round_data{
    syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, bitwise_ptr: BitwiseBuiltin*, range_check_ptr
}(round_id: felt) -> (round: Round) {
    with_attr error_message("Method not allowed. Use latest_round_data instead.") {
        assert_le(1, 0);
    }

    return latest_round_data();
}

@view
func description{
    syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, bitwise_ptr: BitwiseBuiltin*, range_check_ptr
}() -> (description: felt) {
    let (feed_id) = feed_identifier.read();

    return (description=feed_id);
}

@view
func decimals() -> (decimals: felt) {
    return (decimals=8);
}

@view
func type_and_version() -> (meta: felt) {
    return (meta=1);
}
