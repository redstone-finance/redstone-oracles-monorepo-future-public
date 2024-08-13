extern crate alloc;
use std::collections::BTreeSet;

use casper_contract::{
    contract_api::{
        runtime, storage,
        storage::{add_contract_version, create_contract_package_at_hash},
    },
    unwrap_or_revert::UnwrapOrRevert,
};
use casper_types::{
    contracts::NamedKeys, ContractHash, ContractPackageHash, ContractVersion, EntryPoints, Key,
    URef,
};

use crate::contracts::constants::GROUP_NAME_OWNER;

pub fn create_contract(
    entry_points: EntryPoints,
    named_keys: Option<NamedKeys>,
    hash_name: &str,
    uref_name: &str,
    owner_name: Option<String>,
) -> (ContractHash, ContractVersion) {
    let (contract_package_hash, access_uref) = create_contract_package_at_hash();

    runtime::put_key(hash_name, contract_package_hash.into());
    runtime::put_key(uref_name, access_uref.into());

    let named_keys = match named_keys {
        Some(named_keys) => named_keys,
        None => NamedKeys::new(),
    };

    let result = add_contract_version(contract_package_hash, entry_points, named_keys);

    if let Some(owner_name) = owner_name {
        let owner_uref = set_up_owner_group(contract_package_hash);

        runtime::put_key(&owner_name, owner_uref.into());
    }

    result
}

fn set_up_owner_group(contract_package_hash: ContractPackageHash) -> URef {
    let caller = runtime::get_caller();
    let x = Key::Account(caller);
    let uref = storage::new_uref(x).into_read();

    let mut uref_set = BTreeSet::new();
    uref_set.insert(uref);

    storage::create_contract_user_group(contract_package_hash, GROUP_NAME_OWNER, 0, uref_set)
        .unwrap_or_revert();

    uref
}
