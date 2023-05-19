library from_bytes;

use std::bytes::Bytes;

pub trait FromBytes {
    fn from_bytes(bytes: Bytes) -> Self;
}
