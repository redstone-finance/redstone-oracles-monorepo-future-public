use crate::core::run_env::RunEnv;
use casper_types::{bytesrepr::Bytes, U256};
use redstone::helpers::hex::read_payload_bytes;
use std::collections::HashMap;

#[macro_export]
macro_rules! hashmap {
    ($( $key:expr => $val:expr ),*) => {{
         let mut map = ::std::collections::HashMap::new();
         $( map.insert($key.to_string(), U256::from($val)); )*
         map
    }};
}
pub(crate) const SAMPLE_SYSTEM_TIMESTAMP: u64 = 1707738300;
pub(crate) const SAMPLE_SYSTEM_TIMESTAMP_2: u64 = 1707834600;

#[derive(Debug, Clone)]
pub(crate) struct Sample {
    path: &'static str,
    pub(crate) values: HashMap<String, U256>,
    timestamp: u64,
    pub(crate) system_timestamp: u64,
}

pub(crate) fn sample_eth_btc_avax_5sig() -> Sample {
    Sample {
        path: "./sample-data/ETH_BTC_AVAX_5sig.hex",
        values: hashmap![
            "ETH" => 248111446713u128,
            "BTC" => 4783856731782u128,
            "AVAX" => 3859000000u128
        ],
        timestamp: 1707738270000,
        system_timestamp: SAMPLE_SYSTEM_TIMESTAMP,
    }
}

pub(crate) fn sample_eth_btc_avax_5sig_2() -> Sample {
    Sample {
        path: "./sample-data/ETH_BTC_AVAX_5sig_2.hex",
        values: hashmap![
            "ETH" => 262053277833u128,
            "BTC" => 4890107010532u128,
            "AVAX" => 3936900408u128
        ],
        timestamp: 1707834540000,
        system_timestamp: SAMPLE_SYSTEM_TIMESTAMP_2,
    }
}

impl Sample {
    pub(crate) fn feed_ids(&self) -> Vec<&str> {
        self.values.keys().map(|feed_id| feed_id.as_str()).collect()
    }

    pub(crate) fn read_bytes(&self) -> Bytes {
        read_payload_bytes(self.path).into()
    }

    pub(crate) fn verify_results(
        &self,
        feed_ids: Vec<String>,
        values: Vec<Option<U256>>,
        timestamp: u64,
    ) {
        assert_eq!(self.timestamp, timestamp);
        assert_eq!(
            values,
            feed_ids
                .iter()
                .map(|feed_id| self.values.get(feed_id).cloned())
                .collect::<Vec<Option<U256>>>()
        );
    }

    pub(crate) fn verify_written_values(self, env: &mut RunEnv) {
        let timestamp = env.price_adapter_read_timestamp();
        assert_eq!(timestamp, self.timestamp);

        let eth_value = env.price_adapter_read_price("ETH");
        assert_eq!(eth_value, self.values["ETH"]);

        let btc_value = env.price_adapter_read_price("BTC");
        assert_eq!(btc_value, self.values["BTC"]);
    }
}
