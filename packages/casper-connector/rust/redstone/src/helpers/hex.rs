use crate::network::specific::{Bytes, FromBytesRepr, U256};
use hex::{decode, encode};
use std::{fs::File, io::Read};

pub fn hex_to_bytes(hex_str: String) -> Vec<u8> {
    let trimmed_hex = hex_str.trim_start_matches("0x");

    decode(trimmed_hex).expect("Conversion error")
}

pub fn hex_from<T: AsRef<[u8]>>(bytes: T) -> String {
    encode(bytes)
}

pub fn make_bytes(vec: Vec<&str>, fun: fn(&str) -> String) -> Vec<Bytes> {
    vec.iter()
        .map(|addr| hex_to_bytes(fun(addr)).into())
        .collect()
}

pub fn make_feed_id(s: &str) -> U256 {
    U256::from_bytes_repr(hex_to_bytes(encode(s)))
}

pub fn make_feed_ids(vec: Vec<&str>) -> Vec<U256> {
    vec.iter().map(|&s| make_feed_id(s)).collect()
}

pub fn read_payload_hex(path: &str) -> String {
    let mut file = File::open(path).unwrap();
    let mut contents = String::new();
    file.read_to_string(&mut contents).expect("Read error");
    contents
}

pub fn read_payload_bytes(path: &str) -> Vec<u8> {
    let contents = read_payload_hex(path);

    hex_to_bytes(contents)
}
