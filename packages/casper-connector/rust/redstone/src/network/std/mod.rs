use crate::network::{error::Error, specific::NetworkSpecific};
use std::eprintln;

mod from_bytes_repr;

pub struct Std;

impl NetworkSpecific for Std {
    type BytesRepr = Vec<u8>;
    type ValueRepr = u128;
    type _Self = Std;

    const VALUE_SIZE: usize = 16;

    fn print(text: String) {
        eprintln!("{}", text)
    }

    fn revert(error: Error) -> ! {
        panic!("{}", error)
    }
}
