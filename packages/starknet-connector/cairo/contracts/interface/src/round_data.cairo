use core::serde::Serde;

#[derive(Drop, Serde)]
pub struct RoundData {
    pub round_number: u64,
    pub payload_timestamp: u64,
    pub block_number: u64,
    pub block_timestamp: u64,
}
