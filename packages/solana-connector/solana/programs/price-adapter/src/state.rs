use anchor_lang::prelude::*;

pub type FeedIdBs = [u8; 32];
pub type ValueBs = [u8; 32];

#[account]
#[derive(Default)]
pub struct PriceData {
    pub feed_id: FeedIdBs,
    pub value: ValueBs,
    pub timestamp: u64,
    pub write_timestamp: Option<u64>,
}
