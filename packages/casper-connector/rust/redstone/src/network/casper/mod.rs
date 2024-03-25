use crate::network::{error::Error, specific::NetworkSpecific};

pub mod contracts;

mod error;
mod from_bytes_repr;

pub struct Casper;

impl NetworkSpecific for Casper {
    type BytesRepr = casper_types::bytesrepr::Bytes;
    type ValueRepr = casper_types::U256;
    type _Self = Self;

    const VALUE_SIZE: usize = 32;

    fn print(_text: String) {
        #[cfg(all(not(test), feature = "print_debug"))]
        {
            casper_contract::contract_api::runtime::print(&_text);
        }

        #[cfg(test)]
        {
            println!("{}", _text);
        }
    }

    fn revert(error: Error) -> ! {
        #[cfg(not(test))]
        {
            casper_contract::contract_api::runtime::revert(error)
        }

        #[cfg(test)]
        {
            panic!("{}", error)
        }
    }
}
