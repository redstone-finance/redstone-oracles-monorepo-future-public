use alloc::{format, vec, vec::Vec};

use casper_contract::{
    contract_api::{runtime, storage},
    unwrap_or_revert::UnwrapOrRevert,
};
use casper_types::{bytesrepr::Bytes, ApiError, U256};

use redstone::{
    core::{
        config::Config, processor::process_payload as redstone_process_payload,
        processor_result::ProcessorResult,
    },
    network::{as_str::AsAsciiStr, assert::Assert, error::Error},
    print_debug,
};
use redstone_casper::contracts::{
    constants::{
        ARG_NAME_FEED_ID, ARG_NAME_FEED_IDS, ARG_NAME_SIGNERS, ARG_NAME_SIGNER_COUNT_THRESHOLD,
        STORAGE_KEY_TIMESTAMP, STORAGE_KEY_VALUES,
    },
    run_mode::{RunMode, RunMode::Write},
    runtime::{get_ref, read_key_value, read_uref_key, return_value},
};

use crate::{config_preparator::ConfigPreparator, price_adapter_error::PriceAdapterError};

pub(crate) struct PriceAdapter;

const NO_VALUE: U256 = U256::zero();

impl PriceAdapter {
    pub(crate) const STORAGE_KEY_SIGNER_COUNT_THRESHOLD: &'static str =
        ARG_NAME_SIGNER_COUNT_THRESHOLD;
    pub(crate) const STORAGE_KEY_SIGNERS: &'static str = ARG_NAME_SIGNERS;
    pub(crate) const STORAGE_KEY_FEED_IDS: &'static str = ARG_NAME_FEED_IDS;

    pub(crate) fn process_payload(
        feed_ids: Vec<U256>,
        payload: Bytes,
        mode: RunMode,
    ) -> (u64, Vec<U256>) {
        let config = Config::prepare_with(feed_ids.clone());

        let result = redstone_process_payload(config, payload);
        print_debug!("{:?}", result);

        if let Write = mode {
            Self::write_result(feed_ids, &result);
        }

        result.into()
    }

    pub(crate) fn write_result(feed_ids: Vec<U256>, result: &ProcessorResult) {
        let (timestamp, uref): (u64, _) = read_uref_key(STORAGE_KEY_TIMESTAMP);

        storage::write(
            uref,
            result.min_timestamp.assert_or_revert(
                |x| *x > timestamp,
                |_| Error::contract_error(PriceAdapterError::TimestampMustBeGreaterThanBefore),
            ),
        );

        let values_uref = get_ref(STORAGE_KEY_VALUES);

        for (i, feed_id) in feed_ids.iter().enumerate() {
            storage::dictionary_put(values_uref, &feed_id.as_ascii_str(), result.values[i]);
        }

        let (old_feed_ids, feed_ids_uref): (Vec<U256>, _) =
            read_uref_key(Self::STORAGE_KEY_FEED_IDS);

        let diff = old_feed_ids
            .into_iter()
            .filter(|item| !feed_ids.contains(item))
            .collect::<Vec<_>>();

        for feed_id in diff.iter() {
            storage::dictionary_put(values_uref, &feed_id.as_ascii_str(), NO_VALUE);
        }

        storage::write(feed_ids_uref, feed_ids);
    }

    pub(crate) fn read_values(feed_ids: Vec<U256>) -> Vec<U256> {
        let dic_uref = get_ref(STORAGE_KEY_VALUES);

        let result = feed_ids
            .iter()
            .enumerate()
            .map(|(i, feed_id)| {
                let err = Error::contract_error(PriceAdapterError::MissingDataFeedValue(
                    i,
                    feed_id.as_ascii_str(),
                ));
                storage::dictionary_get(dic_uref, &feed_id.as_ascii_str())
                    .unwrap_or_revert_with(ApiError::Read)
                    .map(|value: U256| value.assert_or_revert(|&v| v != NO_VALUE, |_| err.clone()))
                    .unwrap_or_revert_with(err)
            })
            .collect();

        result
    }

    pub(crate) fn read_timestamp() -> u64 {
        read_key_value(STORAGE_KEY_TIMESTAMP)
    }

    pub(crate) fn read_price_and_timestamp() -> ! {
        let feed_id = runtime::get_named_arg(ARG_NAME_FEED_ID);
        let results = Self::read_values(vec![feed_id]);

        return_value((results[0], Self::read_timestamp()))
    }
}
