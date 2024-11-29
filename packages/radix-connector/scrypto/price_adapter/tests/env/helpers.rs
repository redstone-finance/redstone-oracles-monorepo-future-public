#![allow(clippy::module_inception)]

#[cfg(feature = "real_network")]
pub mod helpers {
    use price_adapter::types::types::{FeedIds, Payload, Signers};
    use redstone::helpers::hex::hex_from;

    #[cfg(test)]
    #[inline]
    pub fn make_signers(input: Vec<&str>) -> Signers {
        redstone::helpers::hex::make_bytes(input, |s| s.to_string())
    }

    #[cfg(test)]
    #[inline]
    pub fn make_feed_ids(input: Vec<&str>) -> FeedIds {
        redstone::helpers::hex::make_bytes(input, |s| hex_from(s))
    }

    pub(crate) fn read_payload(path: &str) -> Payload {
        redstone::helpers::hex::read_payload_bytes(path)
    }
}

#[cfg(not(feature = "real_network"))]
pub mod helpers {
    use price_adapter::types::types::{FeedIds, Payload, Signers, DATA_SEPARATOR};

    #[cfg(test)]
    #[inline]
    pub fn make_signers(input: Vec<&str>) -> Signers {
        input.join(DATA_SEPARATOR)
    }

    #[cfg(test)]
    #[inline]
    pub fn make_feed_ids(input: Vec<&str>) -> FeedIds {
        input.join(DATA_SEPARATOR)
    }

    pub(crate) fn read_payload(path: &str) -> Payload {
        redstone::helpers::hex::read_payload_hex(path)
    }
}
