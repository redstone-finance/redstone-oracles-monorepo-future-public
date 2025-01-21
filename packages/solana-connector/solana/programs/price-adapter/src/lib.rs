pub mod instructions;
pub mod state;
pub mod util;

use crate::state::ValueBs;
use crate::util::current_time_as_millis;
use anchor_lang::prelude::*;
use instructions::*;
use redstone::contract::verification::verify_signers_config;
use state::ConfigAccount;
use state::{FeedIdBs, SignerAddressBs};

declare_id!("kv6Fa8Mx8bBfKQR1U315tJaWFtYQmXZgAhLfeDv3Tqa");

#[program]
pub mod price_adapter {
    use super::*;
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

    pub fn initialize(
        ctx: Context<Initialize>,
        signers: Vec<SignerAddressBs>,
        trusted_updaters: Vec<Pubkey>,
        signer_count_threshold: u8,
        max_timestamp_delay_ms: u64,
        max_timestamp_ahead_ms: u64,
        min_interval_between_updates_ms: u64,
    ) -> Result<()> {
        let config_account = &mut ctx.accounts.config_account;
        config_account.owner = ctx.accounts.owner.key();
        config_account.signers = signers;
        config_account.trusted_updaters = trusted_updaters;
        config_account.signer_count_threshold = signer_count_threshold;
        config_account.max_timestamp_delay_ms = max_timestamp_delay_ms;
        config_account.max_timestamp_ahead_ms = max_timestamp_ahead_ms;
        config_account.min_interval_between_updates_ms = min_interval_between_updates_ms;

        check_config(config_account)
    }

    pub fn update_config(
        ctx: Context<UpdateConfig>,
        signers: Option<Vec<SignerAddressBs>>,
        trusted_updaters: Option<Vec<Pubkey>>,
        signer_count_threshold: Option<u8>,
        max_timestamp_delay_ms: Option<u64>,
        max_timestamp_ahead_ms: Option<u64>,
        min_interval_between_updates_ms: Option<u64>,
    ) -> Result<()> {
        let config_account = &mut ctx.accounts.config_account;
        if let Some(signers) = signers {
            config_account.signers = signers;
        }
        if let Some(trusted_updaters) = trusted_updaters {
            config_account.trusted_updaters = trusted_updaters;
        }
        if let Some(threshold) = signer_count_threshold {
            config_account.signer_count_threshold = threshold;
        }
        if let Some(delay) = max_timestamp_delay_ms {
            config_account.max_timestamp_delay_ms = delay;
        }
        if let Some(ahead) = max_timestamp_ahead_ms {
            config_account.max_timestamp_ahead_ms = ahead;
        }
        if let Some(min_interval_between_updates_ms) = min_interval_between_updates_ms {
            config_account.min_interval_between_updates_ms = min_interval_between_updates_ms;
        }
        check_config(config_account)
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
}

fn check_config(config: &ConfigAccount) -> Result<()> {
    verify_signers_config(&config.redstone_signers(), config.signer_count_threshold)?;

    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        init,
        payer = owner,
        // leaving some excess space for future use
        space = 8 + std::mem::size_of::<ConfigAccount>() + 32 * 10,
        seeds = [b"config"],
        bump
    )]
    pub config_account: Account<'info, ConfigAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    pub owner: Signer<'info>,
    #[account(
        mut,
        seeds = [b"config"],
        bump,
        has_one = owner
    )]
    pub config_account: Account<'info, ConfigAccount>,
}
