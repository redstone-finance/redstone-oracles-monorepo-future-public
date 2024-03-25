extern crate alloc;

use crate::network::specific::U256;
use alloc::{format, string::String};

pub trait AsHexStr {
    fn as_hex_str(&self) -> String;
}

impl AsHexStr for &[u8] {
    fn as_hex_str(&self) -> String {
        self.iter().map(|byte| format!("{:02x}", byte)).collect()
    }
}

#[cfg(feature = "network_casper")]
impl AsHexStr for casper_types::bytesrepr::Bytes {
    fn as_hex_str(&self) -> String {
        self.as_slice().as_hex_str()
    }
}

impl AsHexStr for U256 {
    fn as_hex_str(&self) -> String {
        format!("{:X}", self)
    }
}

impl AsHexStr for Vec<u8> {
    fn as_hex_str(&self) -> String {
        self.as_slice().as_hex_str()
    }
}

impl AsHexStr for Box<[u8]> {
    fn as_hex_str(&self) -> String {
        self.as_ref().as_hex_str()
    }
}

pub trait AsAsciiStr {
    fn as_ascii_str(&self) -> String;
}

impl AsAsciiStr for &[u8] {
    fn as_ascii_str(&self) -> String {
        self.iter().map(|&code| code as char).collect()
    }
}

impl AsAsciiStr for Vec<u8> {
    fn as_ascii_str(&self) -> String {
        self.as_slice().as_ascii_str()
    }
}

#[cfg(feature = "network_casper")]
impl AsAsciiStr for casper_types::bytesrepr::Bytes {
    fn as_ascii_str(&self) -> String {
        self.as_slice().as_ascii_str()
    }
}

impl AsAsciiStr for U256 {
    fn as_ascii_str(&self) -> String {
        let hex_string = self.as_hex_str();
        let bytes = (0..hex_string.len())
            .step_by(2)
            .map(|i| u8::from_str_radix(&hex_string[i..i + 2], 16))
            .collect::<Result<Vec<u8>, _>>()
            .unwrap();

        bytes.as_ascii_str()
    }
}
