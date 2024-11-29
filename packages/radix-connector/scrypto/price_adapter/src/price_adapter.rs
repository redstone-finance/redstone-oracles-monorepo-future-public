use crate::{
    get_current_time::get_current_time,
    price_adapter_error::PriceAdapterError,
    types::{
        types::{
            process_feed_ids, process_payload_bytes, process_signers, FeedIds, Payload, Signers,
        },
        U256Digits,
    },
};
use redstone::{
    core::{config::Config, processor::process_payload},
    network::{
        as_str::AsAsciiStr,
        assert::{Assert, Unwrap},
        error::Error,
        specific::Bytes,
    },
};
use scrypto::prelude::*;

#[blueprint]
mod price_adapter {

    struct PriceAdapter {
        signer_count_threshold: u8,
        signers: Vec<Bytes>,
        prices: HashMap<U256Digits, U256Digits>,
        timestamp: u64,
        current_timestamp_mock: Option<u64>,
    }

    impl PriceAdapter {
        pub fn instantiate(
            signer_count_threshold: u8,
            allowed_signer_addresses: Signers,
        ) -> Global<PriceAdapter> {
            Self::make_instance(signer_count_threshold, allowed_signer_addresses, None)
        }

        #[allow(dead_code)]
        pub fn instantiate_with_mock_timestamp(
            signer_count_threshold: u8,
            allowed_signer_addresses: Signers,
            timestamp_mock: Option<u64>,
        ) -> Global<PriceAdapter> {
            Self::make_instance(
                signer_count_threshold,
                allowed_signer_addresses,
                timestamp_mock,
            )
        }

        pub fn get_prices(
            &mut self,
            feed_ids: FeedIds,
            payload: Payload,
        ) -> (u64, Vec<U256Digits>) {
            self.process_payload(process_feed_ids(feed_ids), process_payload_bytes(payload))
        }

        pub fn write_prices(
            &mut self,
            feed_ids: FeedIds,
            payload: Payload,
        ) -> (u64, Vec<U256Digits>) {
            self.process_payload_and_write(
                process_feed_ids(feed_ids),
                process_payload_bytes(payload),
            )
        }

        pub fn read_prices(&mut self, feed_ids: FeedIds) -> Vec<U256Digits> {
            process_feed_ids(feed_ids)
                .iter()
                .enumerate()
                .map(|(index, feed_id)| self.read_price(feed_id.to_digits(), index))
                .collect()
        }

        fn read_price(&mut self, feed_id: U256Digits, index: usize) -> U256Digits {
            *self.prices.get(&feed_id).unwrap_or_revert(|_| {
                Error::contract_error(PriceAdapterError::MissingDataFeedValue(
                    index,
                    U256::from_digits(feed_id).as_ascii_str(),
                ))
            })
        }

        pub fn read_timestamp(&mut self) -> u64 {
            self.timestamp
        }

        fn process_payload(
            &mut self,
            feed_ids: Vec<U256>,
            payload: Bytes,
        ) -> (u64, Vec<U256Digits>) {
            let mut current_time = get_current_time();

            if current_time == 0 {
                if let Some(mock_timestamp) = self.current_timestamp_mock {
                    current_time = mock_timestamp;
                };
            };

            let config = Config {
                signer_count_threshold: self.signer_count_threshold,
                signers: self.signers.clone(),
                feed_ids,
                block_timestamp: current_time * 1000,
            };

            let result = process_payload(config, payload);
            let prices = result.values.iter().map(|v| v.to_digits()).collect();

            (result.min_timestamp, prices)
        }

        fn process_payload_and_write(
            &mut self,
            feed_ids: Vec<U256>,
            payload: Bytes,
        ) -> (u64, Vec<U256Digits>) {
            let (timestamp, values) = self.process_payload(feed_ids.clone(), payload);

            timestamp.assert_or_revert(
                |&ts| ts > self.timestamp,
                |_| Error::contract_error(PriceAdapterError::TimestampMustBeGreaterThanBefore),
            );

            self.timestamp = timestamp;
            self.prices = feed_ids
                .iter()
                .zip(values.clone())
                .map(|(key, value)| (key.to_digits(), value))
                .collect();

            (timestamp, values)
        }

        fn make_instance(
            signer_count_threshold: u8,
            allowed_signer_addresses: Signers,
            current_timestamp_mock: Option<u64>,
        ) -> Global<PriceAdapter> {
            let signers = process_signers(allowed_signer_addresses);

            signers.len().assert_or_revert(
                |&v| v > 0usize,
                |_| Error::contract_error(PriceAdapterError::SignersMustNotBeEmpty),
            );

            signer_count_threshold.assert_or_revert(
                |&v| (v as usize) <= signers.len(),
                |&v| Error::contract_error(PriceAdapterError::WrongSignerCountThresholdValue(v)),
            );

            Self {
                signer_count_threshold,
                signers,
                prices: hashmap!(),
                timestamp: 0,
                current_timestamp_mock,
            }
            .instantiate()
            .prepare_to_globalize(OwnerRole::None)
            .globalize()
        }
    }
}
