use casper_contract::contract_api::{runtime, storage, storage::add_contract_version};
use casper_types::{contracts::NamedKeys, ContractPackageHash, EntryPoints};

use crate::contracts::{
    constants::ARG_NAME_CONTRACT_PACKAGE_HASH, create_contract,
    runtime::get_named_contract_package_hash_opt,
};

const CONTRACT_VERSION_KEY: &str = "version";

pub trait Contract {
    const CONTRACT_KEY: &'static str;
    fn entry_points() -> EntryPoints;
    fn init();
}

#[inline]
pub fn contract_install<C: Contract>() {
    let contract_package_hash: Option<ContractPackageHash> =
        get_named_contract_package_hash_opt(ARG_NAME_CONTRACT_PACKAGE_HASH);
    let (stored_contract_hash, contract_version) = if let Some(package_hash) = contract_package_hash
    {
        add_contract_version(package_hash, C::entry_points(), NamedKeys::default())
    } else {
        create_contract::create_contract(
            C::entry_points(),
            Some(NamedKeys::default()),
            C::CONTRACT_KEY,
            &(C::CONTRACT_KEY.to_owned() + "_package_uref"),
            (C::CONTRACT_KEY.to_owned() + "_owner_uref").into(),
        )
    };

    // Store the contract version in the context's named keys.
    let version_uref = storage::new_uref(contract_version);
    runtime::put_key(CONTRACT_VERSION_KEY, version_uref.into());

    // Create a named key for the contract hash.
    runtime::put_key(C::CONTRACT_KEY, stored_contract_hash.into());
}
