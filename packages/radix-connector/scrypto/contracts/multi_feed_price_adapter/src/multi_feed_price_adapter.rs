use common::{
    decimals::{ToRedStoneDecimal, ToRedStoneDecimals},
    process_payload::process_payload,
    read_price_data::{read_price_data, read_prices_data},
    time::Time,
    types::{process_feed_ids, FeedIds, Payload, Signers, ToDigits, U256Digits},
    verify::{verify_signers, verify_timestamps},
};
use scrypto::prelude::*;

#[blueprint]
mod multi_feed_price_adapter {
    use crate::price_data::{PriceData, PriceDataRaw};

    struct MultiFeedPriceAdapter {
        signer_count_threshold: u8,
        signers: Vec<Vec<u8>>,
        prices: HashMap<U256Digits, PriceDataRaw>,
        time: Time,
    }

    impl MultiFeedPriceAdapter {
        pub fn instantiate(
            signer_count_threshold: u8,
            allowed_signer_addresses: Signers,
        ) -> Global<MultiFeedPriceAdapter> {
            Self::make_instance(
                signer_count_threshold,
                allowed_signer_addresses,
                Time::System,
            )
        }

        pub fn instantiate_with_mock_timestamp(
            signer_count_threshold: u8,
            allowed_signer_addresses: Signers,
            timestamp_mock: Option<u64>,
        ) -> Global<MultiFeedPriceAdapter> {
            Self::make_instance(
                signer_count_threshold,
                allowed_signer_addresses.clone(),
                timestamp_mock.into(),
            )
        }

        pub fn get_unique_signer_threshold(&self) -> u8 {
            self.signer_count_threshold
        }

        pub fn get_prices_raw(
            &self,
            feed_ids: FeedIds,
            payload: Payload,
        ) -> (u64, Vec<U256Digits>) {
            self.process_payload(feed_ids, payload)
        }

        pub fn get_prices(&self, feed_ids: FeedIds, payload: Payload) -> (u64, Vec<Decimal>) {
            let (timestamp, values) = self.get_prices_raw(feed_ids.clone(), payload);

            (timestamp, values.to_redstone_decimals(feed_ids))
        }

        pub fn write_prices_raw(
            &mut self,
            feed_ids: FeedIds,
            payload: Payload,
        ) -> (u64, Vec<U256Digits>) {
            self.process_payload_and_write(feed_ids, payload)
        }

        pub fn write_prices(&mut self, feed_ids: FeedIds, payload: Payload) -> (u64, Vec<Decimal>) {
            let (timestamp, values) = self.write_prices_raw(feed_ids.clone(), payload);

            (timestamp, values.to_redstone_decimals(feed_ids))
        }

        pub fn read_prices_raw(&self, feed_ids: FeedIds) -> Vec<U256Digits> {
            self.read_price_data_raw(feed_ids)
                .iter()
                .map(|&d| d.price)
                .collect()
        }

        pub fn read_prices(&self, feed_ids: FeedIds) -> Vec<Decimal> {
            self.read_prices_raw(feed_ids.clone())
                .to_redstone_decimals(feed_ids)
        }

        pub fn read_price_data_raw(&self, feed_ids: FeedIds) -> Vec<PriceDataRaw> {
            read_prices_data(&self.prices, feed_ids)
        }

        pub fn read_price_data(&self, feed_ids: FeedIds) -> Vec<PriceData> {
            self.read_price_data_raw(feed_ids.clone())
                .to_redstone_decimals(feed_ids)
        }

        pub fn read_price_and_timestamp_raw(&self, feed_id: Vec<u8>) -> (U256Digits, u64) {
            let data = read_price_data(&self.prices, &feed_id.into(), 0);

            (data.price, data.timestamp)
        }

        pub fn read_price_and_timestamp(&self, feed_id: Vec<u8>) -> (Decimal, u64) {
            let data = self.read_price_and_timestamp_raw(feed_id.clone());

            (data.0.to_redstone_decimal(&feed_id), data.1)
        }

        pub fn read_timestamp(&self, feed_id: Vec<u8>) -> u64 {
            self.read_price_and_timestamp(feed_id).1
        }

        fn process_payload(&self, feed_ids: FeedIds, payload: Payload) -> (u64, Vec<U256Digits>) {
            process_payload(
                self.time.get_current_in_ms(),
                self.signer_count_threshold,
                self.signers.clone(),
                feed_ids,
                payload,
            )
        }

        fn process_payload_and_write(
            &mut self,
            feed_ids: FeedIds,
            payload: Payload,
        ) -> (u64, Vec<U256Digits>) {
            let (timestamp, values) = self.process_payload(feed_ids.clone(), payload);
            let current_timestamp = self.time.get_current_in_ms();

            process_feed_ids(feed_ids)
                .iter()
                .map(|v| v.to_digits())
                .zip(values.clone())
                .for_each(|(feed_id, value)| {
                    let old_price_data = self.prices.get(&feed_id);

                    if let Some(price_data) = old_price_data {
                        verify_timestamps(
                            current_timestamp,
                            timestamp,
                            Some(price_data.latest_update_timestamp),
                            price_data.timestamp,
                        )
                    }

                    _ = &self.prices.insert(
                        feed_id,
                        PriceDataRaw {
                            price: value,
                            timestamp,
                            latest_update_timestamp: current_timestamp,
                        },
                    );
                });

            self.time.maybe_increase(1);

            (timestamp, values)
        }

        fn make_instance(
            signer_count_threshold: u8,
            allowed_signer_addresses: Signers,
            time: Time,
        ) -> Global<MultiFeedPriceAdapter> {
            let signers = verify_signers(signer_count_threshold, allowed_signer_addresses);

            Self {
                signer_count_threshold,
                signers,
                prices: hashmap!(),
                time,
            }
            .instantiate()
            .prepare_to_globalize(OwnerRole::None)
            .globalize()
        }
    }
}
