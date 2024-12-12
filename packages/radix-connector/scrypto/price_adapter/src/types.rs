#[cfg(feature = "real_network")]
pub use real_network::*;

#[cfg(not(feature = "real_network"))]
pub use not_real_network::*;

use redstone::{
    network::{
        from_bytes_repr::FromBytesRepr,
        specific::{Bytes, U256},
    },
    FeedId,
};

pub type U256Digits = [u64; 4];

#[cfg(feature = "real_network")]
pub mod real_network {

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
    pub fn process_feed_ids(input: FeedIds) -> Vec<super::FeedId> {
        input.iter().map(|bytes| bytes.clone().into()).collect()
    }
}

#[cfg(not(feature = "real_network"))]
pub mod not_real_network {
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
    pub fn process_feed_ids(input: FeedIds) -> Vec<super::FeedId> {
        if input.is_empty() {
            return Vec::new();
        }

        input.split(DATA_SEPARATOR).map(make_feed_id).collect()
    }
}

pub trait ToDigits {
    fn to_digits(self) -> U256Digits;
}

impl ToDigits for FeedId {
    fn to_digits(self) -> U256Digits {
        let vec: Vec<u8> = self.0.into();
        U256::from_bytes_repr(vec.trim_zeros()).to_digits()
    }
}

// TODO: make it public in rust-sdk or make a function from_bytes_repr() for FeedId
trait TrimZeros {
    fn trim_zeros(self) -> Self;
}

impl TrimZeros for Vec<u8> {
    fn trim_zeros(mut self) -> Self {
        if let Some(i) = self.iter().rposition(|&byte| byte != 0) {
            self.truncate(i + 1);
        }

        self
    }
}
