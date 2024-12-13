#[cfg(feature = "real_network")]
pub use real_network::*;

#[cfg(not(feature = "real_network"))]
pub use not_real_network::*;

use std::{fs::File, io::Read};

#[cfg(feature = "real_network")]
pub mod real_network {
    use price_adapter::types::{FeedIds, Payload, Signers};
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
        super::read_payload_bytes(path)
    }
}

#[cfg(not(feature = "real_network"))]
pub mod not_real_network {
    use price_adapter::types::{FeedIds, Payload, Signers, DATA_SEPARATOR};

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
        super::read_payload_hex(path)
    }
}

#[cfg(test)]
#[inline]
pub fn read_payload_hex(path: &str) -> String {
    let mut file = File::open(path).unwrap();
    let mut contents = String::new();
    file.read_to_string(&mut contents).expect("Read error");
    contents
}

#[cfg(feature = "real_network")]
#[cfg(test)]
#[inline]
pub fn read_payload_bytes(path: &str) -> Vec<u8> {
    let contents = read_payload_hex(path);

    redstone::helpers::hex::hex_to_bytes(contents)
}
