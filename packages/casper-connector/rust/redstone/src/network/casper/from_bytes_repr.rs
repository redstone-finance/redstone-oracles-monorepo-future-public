use crate::network::specific::{FromBytesRepr, U256};

impl FromBytesRepr<Vec<u8>> for U256 {
    fn from_bytes_repr(bytes: Vec<u8>) -> Self {
        bytes.as_slice().into()
    }
}
