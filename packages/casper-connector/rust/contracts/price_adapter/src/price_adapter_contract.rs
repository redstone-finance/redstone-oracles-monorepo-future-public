use alloc::{vec, vec::Vec};

use casper_contract::contract_api::{runtime, runtime::revert};
use casper_types::{
    bytesrepr::Bytes,
    CLType,
    CLType::{List, Unit, U256, U64, U8},
    EntryPoints, Parameter,
};

use redstone::network::error::Error;
use redstone_casper::contracts::{
    constants::{
        ARG_NAME_FEED_ID, ARG_NAME_SIGNERS, ARG_NAME_SIGNER_COUNT_THRESHOLD, ENTRY_POINT_INIT,
        ENTRY_POINT_READ_PRICE_AND_TIMESTAMP, GROUP_NAME_OWNER, STORAGE_KEY_TIMESTAMP,
        STORAGE_KEY_VALUES,
    },
    contract::Contract,
    entry_point::{cltype_bytes, ToEntryPoint},
    price_adapter_trait::adapter_entry_points,
    runtime::{set_up_dictionary_key, set_up_uref_key},
};

use crate::{price_adapter::PriceAdapter, price_adapter_error::PriceAdapterError};

impl Contract for PriceAdapter {
    const CONTRACT_KEY: &'static str = "price_adapter";

    #[inline]
    fn entry_points() -> EntryPoints {
        let mut entry_points = adapter_entry_points();

        entry_points.add_entry_point(ENTRY_POINT_INIT.ownable_entry_point(
            vec![
                Parameter::new(ARG_NAME_SIGNER_COUNT_THRESHOLD, U8),
                Parameter::new(ARG_NAME_SIGNERS, List(cltype_bytes().into())),
            ],
            Unit,
            GROUP_NAME_OWNER,
        ));

        entry_points.add_entry_point(ENTRY_POINT_READ_PRICE_AND_TIMESTAMP.entry_point_single(
            Parameter::new(ARG_NAME_FEED_ID, U256),
            CLType::Tuple2([U256.into(), U64.into()]),
        ));

        entry_points
    }

    #[inline]
    fn init() {
        let signers: Vec<Bytes> = runtime::get_named_arg(ARG_NAME_SIGNERS);
        if signers.is_empty() {
            revert(Error::contract_error(
                PriceAdapterError::SignersMustNotBeEmpty,
            ));
        }

        let signer_count_threshold: u8 = runtime::get_named_arg(ARG_NAME_SIGNER_COUNT_THRESHOLD);

        if signer_count_threshold > signers.len() as u8 {
            revert(Error::contract_error(
                PriceAdapterError::WrongSignerCountThresholdValue(signer_count_threshold),
            ));
        }

        set_up_uref_key(STORAGE_KEY_TIMESTAMP, 0u64, false);
        set_up_uref_key(Self::STORAGE_KEY_FEED_IDS, Vec::<Bytes>::new(), false);
        set_up_dictionary_key(STORAGE_KEY_VALUES);
        set_up_uref_key(Self::STORAGE_KEY_SIGNERS, signers, true);

        set_up_uref_key(
            Self::STORAGE_KEY_SIGNER_COUNT_THRESHOLD,
            signer_count_threshold,
            true,
        );
    }
}
