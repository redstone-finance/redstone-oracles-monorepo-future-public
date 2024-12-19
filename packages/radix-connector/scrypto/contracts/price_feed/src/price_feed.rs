use crate::types::*;
use scrypto::prelude::*;

#[blueprint]
mod price_adapter {
    struct PriceFeed {
        price_adapter_address: Global<AnyComponent>,
        feed_id: FeedId,
    }

    impl PriceFeed {
        pub fn instantiate(
            price_adapter_address: Global<AnyComponent>,
            feed_id: FeedId,
        ) -> Global<PriceFeed> {
            Self {
                price_adapter_address,
                feed_id,
            }
            .instantiate()
            .prepare_to_globalize(OwnerRole::None)
            .globalize()
        }

        pub fn read_price_and_timestamp(&self) -> (Decimal, u64) {
            self.call_for_price_and_timestamp("read_price_and_timestamp")
        }

        pub fn read_price_and_timestamp_raw(&self) -> (U256Digits, u64) {
            self.call_for_price_and_timestamp("read_price_and_timestamp_raw")
        }

        fn call_for_price_and_timestamp<
            T: ScryptoDecode + Categorize<ScryptoCustomValueKind> + Copy,
        >(
            &self,
            method_name: &str,
        ) -> (T, u64) {
            self.call(method_name, scrypto_args!(&self.feed_id))
        }

        fn call<T: ScryptoDecode>(&self, method_name: &str, args: Vec<u8>) -> T {
            let result = ScryptoVmV1Api::object_call(
                self.price_adapter_address.handle().as_node_id(),
                method_name,
                args,
            );

            scrypto_decode(&result).unwrap()
        }
    }
}
