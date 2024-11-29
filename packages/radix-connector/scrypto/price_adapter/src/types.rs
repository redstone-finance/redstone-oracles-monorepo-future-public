#![allow(clippy::module_inception)]

use redstone::network::specific::{Bytes, U256};

pub type U256Digits = [u64; 4];

#[cfg(feature = "real_network")]
pub mod types {
    use redstone::network::from_bytes_repr::FromBytesRepr;

    pub type Payload = Vec<u8>;
    pub type FeedIds = Vec<Vec<u8>>;
    pub type Signers = Vec<Vec<u8>>;

    #[inline]
    pub fn process_payload_bytes(input: Payload) -> super::Bytes {
        input
    }

    #[inline]
    pub fn process_signers(input: Signers) -> Vec<super::Bytes> {
        input
    }

    #[inline]
    pub fn process_feed_ids(input: FeedIds) -> Vec<super::U256> {
        input
            .iter()
            .map(|bytes| super::U256::from_bytes_repr(bytes.clone()))
            .collect()
    }
}

#[cfg(not(feature = "real_network"))]
pub mod types {
    use redstone::helpers::hex::{hex_to_bytes, make_feed_id};

    pub type Payload = String;
    pub type FeedIds = String;
    pub type Signers = String;

    pub const DATA_SEPARATOR: &str = ",";

    #[inline]
    pub fn process_payload_bytes(input: Payload) -> super::Bytes {
        hex_to_bytes(input)
    }

    #[inline]
    pub fn process_signers(input: Signers) -> Vec<super::Bytes> {
        if input.is_empty() {
            return Vec::new();
        }

        input
            .split(DATA_SEPARATOR)
            .map(|s| hex_to_bytes(s.to_string()))
            .collect()
    }

    #[inline]
    pub fn process_feed_ids(input: FeedIds) -> Vec<super::U256> {
        if input.is_empty() {
            return Vec::new();
        }

        input.split(DATA_SEPARATOR).map(make_feed_id).collect()
    }
}
