pub type SignerAddressBs = [u8; 20];

use anchor_lang::prelude::*;
use hex_literal::hex;
use redstone::{
    core::config::Config as RedstoneConfig, solana::SolanaRedStoneConfig, FeedId, SignerAddress,
    TimestampMillis,
};

pub const SOLANA_CONFIG: Config = Config {
    signer_count_threshold: 3,
    signers: REDSTONE_PRIMARY_PROD_ALLOWED_SIGNERS,
    trusted_updaters: TRUSTED_UPDATERS,
    max_timestamp_ahead_ms: 3 * 60 * 1_000,
    max_timestamp_delay_ms: 3 * 60 * 1_000,
    min_interval_between_updates_ms: 40_000,
};

pub struct Config {
    pub signer_count_threshold: u8,
    pub signers: [SignerAddressBs; 5],
    pub trusted_updaters: [Pubkey; 1],
    pub max_timestamp_delay_ms: u64,
    pub max_timestamp_ahead_ms: u64,
    pub min_interval_between_updates_ms: u64,
}

const REDSTONE_PRIMARY_PROD_ALLOWED_SIGNERS: [SignerAddressBs; 5] = [
    hex!("8bb8f32df04c8b654987daaed53d6b6091e3b774"),
    hex!("deb22f54738d54976c4c0fe5ce6d408e40d88499"),
    hex!("51ce04be4b3e32572c4ec9135221d0691ba7d202"),
    hex!("dd682daec5a90dd295d14da4b0bec9281017b5be"),
    hex!("9c5ae89c4af6aa32ce58588dbaf90d18a855b6de"),
];

const TRUSTED_UPDATERS: [Pubkey; 1] = [Pubkey::new_from_array(hex!(
    "5566853a727cdde13350fa618d1b5f21397ec5d8099f8963c56743119478e86f"
))];

impl Config {
    pub fn redstone_signers(&self) -> Vec<SignerAddress> {
        self.signers.iter().map(|s| s.to_vec().into()).collect()
    }

    pub fn redstone_config(
        &self,
        feed_id: FeedId,
        block_timestamp: TimestampMillis,
    ) -> Result<SolanaRedStoneConfig> {
        Ok(RedstoneConfig::try_new(
            self.signer_count_threshold,
            self.redstone_signers(),
            vec![feed_id],
            block_timestamp,
            Some(self.max_timestamp_delay_ms.into()),
            Some(self.max_timestamp_ahead_ms.into()),
        )?
        .into())
    }

    pub fn trusted_updaters(&self) -> &[Pubkey] {
        &self.trusted_updaters
    }
}

#[cfg(test)]
mod tests {
    use crate::config::SOLANA_CONFIG;
    use redstone::contract::verification::verify_signers_config;

    #[test]
    fn verify_integrity_of_the_config() {
        verify_signers_config(
            &SOLANA_CONFIG.redstone_signers(),
            SOLANA_CONFIG.signer_count_threshold,
        )
        .unwrap();
    }
}
