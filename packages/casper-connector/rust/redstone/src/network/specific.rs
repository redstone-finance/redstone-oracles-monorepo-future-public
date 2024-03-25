use crate::network::{_Network, error::Error};

pub trait FromBytesRepr<T> {
    fn from_bytes_repr(bytes: T) -> Self;
}

pub trait NetworkSpecific {
    type BytesRepr: From<Vec<u8>> + Into<Vec<u8>>;
    type ValueRepr: FromBytesRepr<Vec<u8>>;
    type _Self;

    const VALUE_SIZE: usize;

    fn print(_text: String);
    fn revert(error: Error) -> !;
}

pub type Bytes = <_Network as NetworkSpecific>::BytesRepr;
pub type U256 = <_Network as NetworkSpecific>::ValueRepr;

pub(crate) type Network = <_Network as NetworkSpecific>::_Self;

#[cfg(test)]
#[allow(dead_code)]
pub(crate) const VALUE_SIZE: usize = Network::VALUE_SIZE;

pub fn print(_text: String) {
    Network::print(_text)
}

pub fn revert(error: Error) -> ! {
    Network::revert(error)
}
