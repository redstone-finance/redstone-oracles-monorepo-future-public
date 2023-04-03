%lang starknet

from starkware.cairo.common.cairo_builtins import HashBuiltin

from starkware.cairo.common.math import sign
from starkware.starknet.common.syscalls import get_caller_address

@storage_var
func owner() -> (res: felt) {
}

func write_owner{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    owner_address: felt
) {
    owner.write(owner_address);

    return ();
}

func assert_owner{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() {
    let (caller, owner) = get_owner_and_caller();

    with_attr error_message(
            "Invocation resctricted to the owner: {owner}, but the caller is {caller}") {
        assert caller = owner;
    }

    return ();
}

func get_owner_and_caller{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (
    caller: felt, owner: felt
) {
    let (caller) = get_caller_address();
    let (contract_owner) = owner.read();

    return (caller=caller, owner=contract_owner);
}
