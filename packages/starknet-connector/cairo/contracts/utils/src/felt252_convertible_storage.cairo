use core::option::OptionTrait;
use core::result::ResultTrait;
use core::starknet::{storage_access::StorePacking, SyscallResult};
use utils::felt252_convertible::Felt252Convertible;

pub impl StoreFelt252Convertible<
    T, impl TFelt252Convertible: Felt252Convertible<T>
> of StorePacking<T, felt252> {
    #[inline(always)]
    fn pack(value: T) -> felt252 {
        value.to_felt252()
    }

    #[inline(always)]
    fn unpack(value: felt252) -> T {
        Felt252Convertible::from_felt252(value)
    }
}
