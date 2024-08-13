extern crate alloc;
use casper_contract::{
    contract_api::{runtime, storage},
    unwrap_or_revert::UnwrapOrRevert,
};
use casper_types::{
    bytesrepr,
    bytesrepr::{FromBytes, ToBytes},
    ApiError, CLTyped, CLValue, ContractHash, ContractPackageHash, Key, URef,
};

use crate::contracts::contract_error::ContractError;

#[inline]
pub fn set_up_uref_key<T: CLTyped + ToBytes>(key_name: &str, value: T, is_readonly: bool) {
    set_up_key(key_name, || storage::new_uref(&value), is_readonly)
}

#[inline]
pub fn set_up_dictionary_key(key_name: &str) {
    set_up_key(
        key_name,
        || storage::new_dictionary(key_name).unwrap_or_revert(),
        false,
    )
}

#[inline]
fn set_up_key<F: Fn() -> URef>(key_name: &str, value_ref_call: F, is_readonly: bool) {
    let missing_key = runtime::get_key(key_name);
    if missing_key.is_some() {
        runtime::revert(ContractError::KeyAlreadyExists);
    }

    let key = Key::URef(if is_readonly {
        value_ref_call().into_read()
    } else {
        value_ref_call()
    });

    runtime::put_key(key_name, key);

    let retrieved_key = runtime::get_key(key_name).unwrap_or_revert();
    if retrieved_key != key {
        runtime::revert(ContractError::KeyMismatch);
    }
}

#[inline]
pub fn read_key_value<T: CLTyped + FromBytes>(key_name: &str) -> T {
    read_uref_key(key_name).0
}

#[inline]
pub fn read_dictionary_key_value<T: CLTyped + FromBytes>(key_name: &str, key: &str) -> Option<T> {
    read_dictionary_key(key_name, key).0
}

#[inline]
pub fn read_uref_key<T: CLTyped + FromBytes>(key_name: &str) -> (T, URef) {
    let (value, uref) = read_key(key_name, storage::read);

    (value.unwrap_or_revert_with(ApiError::ValueNotFound), uref)
}

#[inline]
pub fn read_dictionary_key<T: CLTyped + FromBytes>(key_name: &str, key: &str) -> (Option<T>, URef) {
    read_key(key_name, |uref| storage::dictionary_get(uref, key))
}

#[inline]
fn read_key<T: CLTyped + FromBytes, F: Fn(URef) -> Result<Option<T>, bytesrepr::Error>>(
    key_name: &str,
    reader: F,
) -> (Option<T>, URef) {
    let uref = get_ref(key_name);

    (reader(uref).unwrap_or_revert_with(ApiError::Read), uref)
}

#[inline]
pub fn get_ref(key_name: &str) -> URef {
    let uref: URef = runtime::get_key(key_name)
        .unwrap_or_revert_with(ApiError::MissingKey)
        .into_uref()
        .unwrap_or_revert_with(ApiError::UnexpectedKeyVariant);
    uref
}

#[inline]
pub fn return_value<T: CLTyped + ToBytes>(value: T) -> ! {
    runtime::ret(CLValue::from_t(value).unwrap_or_revert());
}

#[inline]
pub fn get_named_contract_hash(key: &str) -> ContractHash {
    ContractHash::new(
        runtime::get_named_arg::<Key>(key)
            .into_hash()
            .unwrap_or_revert_with(ContractError::WrongHash),
    )
}

#[inline]
pub fn get_named_contract_package_hash(key: &str) -> ContractPackageHash {
    ContractPackageHash::new(
        runtime::get_named_arg::<Key>(key)
            .into_hash()
            .unwrap_or_revert_with(ContractError::WrongHash),
    )
}

#[inline]
pub fn get_named_contract_package_hash_opt(key: &str) -> Option<ContractPackageHash> {
    let contract_package_key: Option<Key> = runtime::get_named_arg(key);

    contract_package_key.map(|key| {
        ContractPackageHash::new(
            key.into_hash()
                .unwrap_or_revert_with(ContractError::WrongHash),
        )
    })
}
