use alloc::vec;

use casper_types::{
    CLType::{Key, List, Unit, U256, U8},
    EntryPoints, Parameter,
};

use redstone_casper::contracts::{
    constants::{
        ARG_NAME_ADAPTER_ADDRESS, ARG_NAME_FEED_IDS, ARG_NAME_PAYLOAD, ENTRY_POINT_INIT,
        GROUP_NAME_OWNER, STORAGE_KEY_ADAPTER_ADDRESS, STORAGE_KEY_VALUES,
    },
    contract::Contract,
    entry_point::{cltype_bytes, ToEntryPoint},
    price_adapter_trait::adapter_entry_points,
    runtime::{get_named_contract_package_hash, set_up_dictionary_key, set_up_uref_key},
};

use crate::price_relay_adapter::PriceRelayAdapter;

impl Contract for PriceRelayAdapter {
    const CONTRACT_KEY: &'static str = "price_relay_adapter";

    fn entry_points() -> EntryPoints {
        let mut entry_points = adapter_entry_points();

        entry_points.add_entry_point(ENTRY_POINT_INIT.ownable_entry_point_single(
            Parameter::new(ARG_NAME_ADAPTER_ADDRESS, Key),
            Unit,
            GROUP_NAME_OWNER,
        ));

        vec![
            Self::ENTRY_POINT_WRITE_PRICES_CHUNK,
            Self::ENTRY_POINT_GET_PRICES_CHUNK,
        ]
        .iter()
        .for_each(|ep| {
            entry_points.add_entry_point(ep.entry_point(
                vec![
                    Parameter::new(ARG_NAME_FEED_IDS, List(U256.into())),
                    Parameter::new(ARG_NAME_PAYLOAD, cltype_bytes()),
                    Parameter::new(Self::ARG_NAME_HASH, cltype_bytes()),
                    Parameter::new(Self::ARG_NAME_CHUNK_INDEX, U8),
                ],
                Unit,
            ))
        });

        entry_points
    }

    fn init() {
        let adapter_hash = get_named_contract_package_hash(ARG_NAME_ADAPTER_ADDRESS);

        set_up_uref_key(STORAGE_KEY_ADAPTER_ADDRESS, adapter_hash, true);
        set_up_dictionary_key(Self::STORAGE_KEY_PAYLOADS);
        set_up_dictionary_key(STORAGE_KEY_VALUES);
    }
}
