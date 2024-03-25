extern crate alloc;

use casper_contract::contract_api::runtime::blake2b;
use casper_types::bytesrepr::Bytes;

pub trait Hashed<T> {
    fn hashed(&self) -> T;
}

impl Hashed<Bytes> for &[u8] {
    fn hashed(&self) -> Bytes {
        blake2b(self).as_slice().into()
    }
}

impl Hashed<Bytes> for Vec<u8> {
    fn hashed(&self) -> Bytes {
        self.as_slice().hashed()
    }
}

impl Hashed<Bytes> for Bytes {
    fn hashed(&self) -> Bytes {
        self.inner_bytes().hashed()
    }
}
