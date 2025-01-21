use anchor_lang::prelude::*;
use redstone::SignerAddress;

pub type SignerAddressBs = [u8; 20];
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

#[account]
pub struct ConfigAccount {
    pub owner: Pubkey,
    pub signer_count_threshold: u8,
    pub signers: Vec<SignerAddressBs>,
    pub trusted_updaters: Vec<Pubkey>,
    pub max_timestamp_delay_ms: u64,
    pub max_timestamp_ahead_ms: u64,
    pub min_interval_between_updates_ms: u64,
}

impl ConfigAccount {
    pub fn redstone_signers(&self) -> Vec<SignerAddress> {
        self.signers.iter().map(|s| s.to_vec().into()).collect()
    }
}
