use casper_types::{bytesrepr::Bytes, runtime_args, runtime_args::RuntimeArgs, U256};

use redstone::helpers::hex::{hex_from, make_feed_ids};
use redstone_casper::contracts::{
    computed_value::ComputedValue,
    constants::{
        ARG_NAME_CURRENT_TIMESTAMP, ARG_NAME_FEED_IDS, ARG_NAME_PAYLOAD, ENTRY_POINT_GET_PRICES,
        ENTRY_POINT_WRITE_PRICES,
    },
    run_mode::{RunMode, RunMode::Write},
};

use crate::core::{
    run_env::RunEnv,
    utils::{get_system_timestamp, hash_message, split},
};

pub(crate) const ENTRY_POINT_WRITE_PRICES_CHUNK: &str = "write_prices_chunk";
pub(crate) const ENTRY_POINT_GET_PRICES_CHUNK: &str = "get_prices_chunk";
const ARG_NAME_HASH: &str = "hash";
const ARG_NAME_CHUNK_INDEX: &str = "chunk_index";
const STORAGE_KEY_VALUES: &str = "values";

const CHUNK_SIZE: usize = 875;

impl RunEnv {
    pub(crate) fn price_relay_adapter_process_payload(
        &mut self,
        mode: RunMode,
        feed_ids: &[&str],
        payload: Bytes,
        current_timestamp: Option<u64>,
        in_chunks: bool,
    ) -> Option<Vec<ComputedValue>> {
        let feed_ids = make_feed_ids(feed_ids.into());

        let current_timestamp = current_timestamp.unwrap_or(get_system_timestamp());
        let hash = hash_message(&payload);

        if !in_chunks {
            self.call_entry_point(
                Self::PRICE_RELAY_ADAPTER_KEY,
                if let Write = mode { ENTRY_POINT_WRITE_PRICES } else { ENTRY_POINT_GET_PRICES },
                runtime_args! { ARG_NAME_PAYLOAD => payload, ARG_NAME_CURRENT_TIMESTAMP => current_timestamp, ARG_NAME_FEED_IDS => feed_ids },
            );
        } else {
            let chunks = split(payload, CHUNK_SIZE);
            let iterator = chunks.iter().enumerate();

            self.iterate_chunks(mode, iterator, feed_ids, &hash, current_timestamp);
        }

        if let Write = mode {
            return None;
        }

        let hash_string = hex_from(hash);
        let computed_values = self.price_relay_adapter_read_computed_values(&hash_string);

        println!("Computed Values: {:?}", computed_values);

        Some(computed_values)
    }

    pub(crate) fn price_relay_adapter_read_computed_values(
        &mut self,
        hash_string: &str,
    ) -> Vec<ComputedValue> {
        self.unpack(self.query_contract_dic(
            Self::PRICE_RELAY_ADAPTER_KEY,
            STORAGE_KEY_VALUES,
            hash_string,
        ))
    }

    pub(crate) fn iterate_chunks<'a, I: Iterator<Item = (usize, &'a Bytes)>>(
        &mut self,
        mode: RunMode,
        iterator: I,
        feed_ids: Vec<U256>,
        hash: &Bytes,
        current_timestamp: u64,
    ) {
        for (index, chunk) in iterator {
            self.process_chunk(
                mode,
                feed_ids.clone(),
                hash,
                current_timestamp,
                index as u8,
                chunk.clone(),
            );
        }
    }

    pub(crate) fn process_chunk(
        &mut self,
        mode: RunMode,
        feed_ids: Vec<U256>,
        hash: &Bytes,
        current_timestamp: u64,
        index: u8,
        chunk: Bytes,
    ) {
        let process_payload_result = self.call_entry_point(
            Self::PRICE_RELAY_ADAPTER_KEY,
            if let Write = mode {
                ENTRY_POINT_WRITE_PRICES_CHUNK
            } else {
                ENTRY_POINT_GET_PRICES_CHUNK
            },
            runtime_args! {
                ARG_NAME_PAYLOAD => &chunk,
                ARG_NAME_FEED_IDS => &feed_ids,
                ARG_NAME_CHUNK_INDEX => index,
                ARG_NAME_HASH => &hash,
                ARG_NAME_CURRENT_TIMESTAMP => current_timestamp,
            },
        );

        println!("Process Chunk: {:?}", process_payload_result);
    }
}
