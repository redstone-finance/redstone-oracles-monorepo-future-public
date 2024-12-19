#[cfg(any(feature = "real_network_test", feature = "real_network"))]
pub use real_network::*;

#[cfg(not(any(feature = "real_network_test", feature = "real_network")))]
pub use not_real_network::*;

#[cfg(any(feature = "real_network_test", feature = "real_network"))]
pub mod real_network {
    use crate::types::{FeedIds, Payload, Signers};
    use redstone::helpers::hex::hex_from;

    #[inline]
    pub fn make_signers(input: Vec<&str>) -> Signers {
        redstone::helpers::hex::make_bytes(input, |s| s.to_string())
    }

    #[inline]
    pub fn make_feed_ids(input: Vec<&str>) -> FeedIds {
        redstone::helpers::hex::make_bytes(input, |s| hex_from(s))
    }

    pub(crate) fn convert_payload(content: &str) -> Payload {
        redstone::helpers::hex::hex_to_bytes(content.to_string())
    }
}

#[cfg(not(any(feature = "real_network_test", feature = "real_network")))]
pub mod not_real_network {
    use crate::types::{FeedIds, Payload, Signers, DATA_SEPARATOR};

    #[inline]
    pub fn make_signers(input: Vec<&str>) -> Signers {
        input.join(DATA_SEPARATOR)
    }

    #[inline]
    pub fn make_feed_ids(input: Vec<&str>) -> FeedIds {
        input.join(DATA_SEPARATOR)
    }

    pub(crate) fn convert_payload(content: &str) -> Payload {
        content.to_string()
    }
}
