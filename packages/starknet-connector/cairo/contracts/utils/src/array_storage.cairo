use core::serde::Serde;
use core::starknet::{Store, SyscallResult, syscalls::{storage_read_syscall, storage_write_syscall}};
use core::starknet::storage_access::{
    storage_address_from_base_and_offset, StorageAddress, StorageBaseAddress
};
use core::traits::{Into, TryInto};

pub impl ArraySerde of Store<Array<felt252>> {
    #[inline(always)]
    fn read(address_domain: u32, base: StorageBaseAddress) -> SyscallResult<Array<felt252>> {
        let mut result = Default::default();

        let size: usize = Store::<felt252>::read(address_domain, base)?
            .try_into()
            .expect('StoreArray - non usize');

        _read(:address_domain, :base, :size, offset: 0, index: 0_u8, ref acc: result);

        Result::Ok(result)
    }

    #[inline(always)]
    fn write(
        address_domain: u32, base: StorageBaseAddress, value: Array<felt252>
    ) -> SyscallResult<()> {
        Store::<felt252>::write(address_domain, base, value.len().into())?;

        _write(:address_domain, :base, offset: 0, :value, index: 0_u8)
    }

    #[inline(always)]
    fn read_at_offset(
        address_domain: u32, base: StorageBaseAddress, offset: u8
    ) -> SyscallResult<Array<felt252>> {
        let mut result = Default::default();

        let size: usize = Store::<felt252>::read_at_offset(address_domain, base, offset)?
            .try_into()
            .expect('StoreArray - non usize');

        _read(:address_domain, :base, :size, :offset, index: 0_u8, ref acc: result);

        Result::Ok(result)
    }

    #[inline(always)]
    fn write_at_offset(
        address_domain: u32, base: StorageBaseAddress, offset: u8, value: Array<felt252>
    ) -> SyscallResult<()> {
        Store::<felt252>::write_at_offset(address_domain, base, offset, value.len().into())?;

        _write(:address_domain, :base, :offset, :value, index: 0_u8)
    }

    #[inline(always)]
    fn size() -> u8 {
        1
    }
}

fn _read(
    address_domain: u32,
    base: StorageBaseAddress,
    size: usize,
    offset: u8,
    index: u8,
    ref acc: Array<felt252>,
) {
    if index.into() == size {
        return ();
    }

    let value = storage_read_syscall(
        address_domain, storage_address_from_base_and_offset(base, index + offset + 1_u8),
    )
        .expect('StoreArray -non felt');

    acc.append(value);

    _read(:address_domain, :base, :size, :offset, index: index + 1_u8, ref :acc)
}

fn _write(
    address_domain: u32, base: StorageBaseAddress, offset: u8, value: Array<felt252>, index: u8,
) -> SyscallResult<()> {
    if index.into() == value.len() {
        return Result::Ok(());
    }

    storage_write_syscall(
        address_domain,
        storage_address_from_base_and_offset(base, offset + index + 1_u8),
        *value[index.into()],
    )?;

    _write(:address_domain, :base, :offset, :value, index: index + 1_u8)
}
