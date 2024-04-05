use core::array::{Array, ArrayTrait};
use core::option::OptionTrait;
use core::result::ResultTrait;
use core::serde::Serde;
use core::starknet::{Store, SyscallResult};
use core::starknet::storage_access::{
    storage_address_from_base_and_offset, storage_base_address_from_felt252, StorageAddress,
    StorageBaseAddress,
};
use core::starknet::syscalls::{storage_read_syscall, storage_write_syscall};
use core::traits::{Into, TryInto};
use utils::array_storage::ArraySerde;

trait WrappedSerde<T> {} // to avoid multiple implementations of Serde for primitive types

pub impl StoreSerde<
    T, impl TSerde: Serde<T>, impl TDrop: Drop<T>, impl TWrappedSerde: WrappedSerde<T>
> of Store<T> {
    #[inline(always)]
    fn write(address_domain: u32, base: StorageBaseAddress, value: T) -> SyscallResult<()> {
        let mut arr: Array<felt252> = ArrayTrait::new();
        Serde::<T>::serialize(@value, ref arr);

        Store::<Array<felt252>>::write(address_domain, base, arr)
    }

    #[inline(always)]
    fn write_at_offset(
        address_domain: u32, base: StorageBaseAddress, offset: u8, value: T
    ) -> SyscallResult<()> {
        let mut arr: Array<felt252> = ArrayTrait::new();
        Serde::<T>::serialize(@value, ref arr);

        Store::<Array<felt252>>::write_at_offset(address_domain, base, offset, arr)
    }

    #[inline(always)]
    fn read(address_domain: u32, base: StorageBaseAddress) -> SyscallResult<T> {
        let result = Store::<Array<felt252>>::read(address_domain, base).expect('Wrong array');
        let mut span = result.span();

        Result::Ok(Serde::<T>::deserialize(ref span).expect('Wrong structure'))
    }

    #[inline(always)]
    fn read_at_offset(
        address_domain: u32, base: StorageBaseAddress, offset: u8
    ) -> SyscallResult<T> {
        let result = Store::<Array<felt252>>::read_at_offset(address_domain, base, offset)
            .expect('Wrong array');
        let mut span = result.span();

        Result::Ok(Serde::<T>::deserialize(ref span).expect('Wrong structure'))
    }

    #[inline(always)]
    fn size() -> u8 {
        1
    }
}
