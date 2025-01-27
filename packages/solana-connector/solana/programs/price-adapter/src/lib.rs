pub mod config;
pub mod instructions;
pub mod state;
pub mod util;

use crate::instructions::*;
use anchor_lang::prelude::*;
use state::{FeedIdBs, ValueBs};

declare_id!("CvFXyHhjA5QBm1BVMibkZXT12rCq78GZPMzK5tWSagB");

#[program]
pub mod price_adapter {
    use super::*;
    use crate::config::SOLANA_CONFIG;
    use util::debug_msg;

    pub fn write_price(
        ctx: Context<WritePrice>,
        feed_id: FeedIdBs,
        payload: Vec<u8>,
    ) -> Result<()> {
        debug_msg(|| {
            format!(
                "Processing redstone payload of size {} for {:?}",
                payload.len(),
                feed_id,
            )
        });
        instructions::write_price(ctx, feed_id, payload)
    }

    pub fn price_and_timestamp(
        ctx: Context<ReadPrice>,
        _feed_id: FeedIdBs,
    ) -> Result<PriceAndTimestamp> {
        Ok(instructions::price_and_timestamp(ctx))
    }

    pub fn price(ctx: Context<ReadPrice>, _feed_id: FeedIdBs) -> Result<ValueBs> {
        Ok(instructions::price(ctx))
    }

    pub fn timestamp(ctx: Context<ReadPrice>, _feed_id: FeedIdBs) -> Result<u64> {
        Ok(instructions::timestamp(ctx))
    }

    pub fn unique_signers_count(_ctx: Context<Dummy>) -> Result<u8> {
        Ok(SOLANA_CONFIG.signer_count_threshold)
    }
}

/// Use in view-like functions that does not require external parameters
#[derive(Accounts)]
pub struct Dummy {}
