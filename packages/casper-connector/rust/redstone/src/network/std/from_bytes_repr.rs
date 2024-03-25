use crate::network::specific::FromBytesRepr;

impl FromBytesRepr<Vec<u8>> for u128 {
    fn from_bytes_repr(bytes: Vec<u8>) -> u128 {
        let bytes = bytes[(bytes.len().max(16) - 16)..].to_vec();

        let mut result: u128 = 0;
        for &byte in bytes.iter() {
            result = (result << 8) | byte as u128;
        }
        result
    }
}
