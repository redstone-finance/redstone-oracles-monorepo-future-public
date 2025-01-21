use crate::current_time_as_millis;
use crate::{
    state::PriceData,
    util::{debug_msg, make_price_seed},
    ConfigAccount, FeedIdBs,
};
use anchor_lang::prelude::*;
use redstone::{
    contract::verification::UpdateTimestampVerifier,
    core::{config::Config, processor::process_payload},
    network::as_str::AsHexStr,
    solana::SolanaRedStoneConfig,
};

#[derive(Accounts)]
#[instruction(feed_id: FeedIdBs)]
pub struct WritePrice<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + std::mem::size_of::<PriceData>(),
        seeds = [
            &make_price_seed(),
            &feed_id
        ],
        bump,
        constraint = price_account.to_account_info().owner == __program_id
    )]
    pub price_account: Account<'info, PriceData>,
    pub config_account: Account<'info, ConfigAccount>,
    pub system_program: Program<'info, System>,
}

pub fn write_price(ctx: Context<WritePrice>, feed_id: FeedIdBs, payload: Vec<u8>) -> Result<()> {
    let feed_id = feed_id.into();
    let signers = ctx.accounts.config_account.redstone_signers();
    // block_timestamp as milis
    let block_timestamp = current_time_as_millis()?;
    let config: SolanaRedStoneConfig = Config::try_new(
        ctx.accounts.config_account.signer_count_threshold,
        signers,
        vec![feed_id],
        block_timestamp,
    )?
    .into();

    let processed_payload = process_payload(&config, payload)?;

    let price = processed_payload.values[0];
    let price_account = &mut ctx.accounts.price_account;

    UpdateTimestampVerifier::verifier(
        &ctx.accounts.user.key(),
        &ctx.accounts.config_account.trusted_updaters,
    )
    .verify_timestamp(
        block_timestamp,
        price_account.write_timestamp.map(Into::into),
        ctx.accounts
            .config_account
            .min_interval_between_updates_ms
            .into(),
        price_account.timestamp.into(),
        processed_payload.min_timestamp.into(),
    )?;

    price_account.value = price.0;
    price_account.timestamp = processed_payload.min_timestamp.as_millis();
    price_account.feed_id = feed_id.into();
    price_account.write_timestamp = Some(block_timestamp.as_millis());

    debug_msg(|| {
        format!(
            "{} {}: {:?}",
            ctx.accounts.price_account.timestamp,
            feed_id.as_hex_str(),
            price,
        )
    });

    Ok(())
}
