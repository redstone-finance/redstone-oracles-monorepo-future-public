use alloc::{string::String, vec, vec::Vec};

use casper_contract::contract_api::{runtime, runtime::revert, storage};
use casper_types::{bytesrepr::Bytes, U256};

use redstone::network::{as_str::AsHexStr, flattened::Flattened};
use redstone_casper::contracts::{
    computed_value::ComputedValue,
    constants::{ARG_NAME_FEED_IDS, STORAGE_KEY_VALUES},
    contract_error::ContractError,
    hashed::Hashed,
    price_adapter_trait::PriceAdapterTrait,
    run_mode::{RunMode, RunMode::Get},
    runtime::{read_dictionary_key, return_value},
};

const MAX_CHUNK_NUMBER: usize = 8;

pub(crate) struct PriceRelayAdapter;

impl PriceRelayAdapter {
    pub(crate) const ARG_NAME_CHUNK_INDEX: &'static str = "chunk_index";
    pub(crate) const ARG_NAME_HASH: &'static str = "hash";

    pub(crate) const STORAGE_KEY_PAYLOADS: &'static str = "payloads";
    pub(crate) const ENTRY_POINT_WRITE_PRICES_CHUNK: &'static str = "write_prices_chunk";
    pub(crate) const ENTRY_POINT_GET_PRICES_CHUNK: &'static str = "get_prices_chunk";

    pub fn process_chunk(index: usize, hash: Bytes, chunk: Bytes, mode: RunMode) -> ! {
        if index > MAX_CHUNK_NUMBER {
            revert(ContractError::IndexRangeExceeded);
        }

        let hash_string = hash.as_hex_str();

        let (current_payloads, uref): (Option<Vec<Bytes>>, _) =
            read_dictionary_key(Self::STORAGE_KEY_PAYLOADS, &hash_string);

        let mut payloads: Vec<Bytes> =
            current_payloads.unwrap_or(vec![Default::default(); MAX_CHUNK_NUMBER]);

        payloads[index] = chunk;
        storage::dictionary_put(uref, &hash_string, &payloads);
        let payload = payloads.flattened();

        if payload.hashed() != hash {
            return_value(())
        }

        let feed_ids: Vec<U256> = runtime::get_named_arg(ARG_NAME_FEED_IDS);
        let payload = payloads.flattened();

        if let Get = mode {
            Self::get_and_save_prices(feed_ids, payload, Some(hash_string))
        } else {
            let (timestamp, values) = Self::write_prices(feed_ids, payload);

            return_value((timestamp, values))
        }
    }

    pub(crate) fn get_and_save_prices(
        feed_ids: Vec<U256>,
        payload: Bytes,
        hash_string_or_none: Option<String>,
    ) -> ! {
        let hash_string = hash_string_or_none.unwrap_or_else(|| payload.hashed().as_hex_str());
        let (curr_values, uref): (Option<Vec<ComputedValue>>, _) =
            read_dictionary_key(STORAGE_KEY_VALUES, &hash_string);
        let mut push_values = curr_values.unwrap_or_default();

        let feed_ids_clone = feed_ids.clone();
        let existing_value = push_values
            .iter()
            .rfind(|&x| feed_ids_clone.iter().all(|id| x.1.contains(id)))
            .map(|x| {
                let filtered_values: Vec<_> =
                    x.1.iter()
                        .enumerate()
                        .filter_map(|(index, id)| {
                            if feed_ids_clone.contains(id) {
                                x.2[index].into()
                            } else {
                                None
                            }
                        })
                        .collect();

                (x.0, feed_ids_clone, filtered_values)
            });

        let computed_value = existing_value.unwrap_or_else(|| {
            let (timestamp, values) = Self::get_prices(feed_ids.clone(), payload);
            (timestamp, feed_ids, values)
        });

        if push_values.is_empty() || push_values[push_values.len() - 1] != computed_value {
            push_values.push(computed_value.clone());
            storage::dictionary_put(uref, &hash_string, push_values);
        }

        return_value((computed_value.0, computed_value.2))
    }
}
