use crate::config::SOLANA_CONFIG;
use crate::{
    state::PriceData,
    util::{current_time_as_millis, debug_msg, make_price_seed},
    FeedIdBs,
};
use anchor_lang::prelude::*;
use redstone::{
    contract::verification::UpdateTimestampVerifier, core::processor::process_payload,
    network::as_str::AsHexStr,
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
    pub system_program: Program<'info, System>,
}

pub fn write_price(ctx: Context<WritePrice>, feed_id: FeedIdBs, payload: Vec<u8>) -> Result<()> {
    let feed_id = feed_id.into();
    // block_timestamp as milis
    let block_timestamp = current_time_as_millis()?;

    let config = SOLANA_CONFIG.redstone_config(feed_id, block_timestamp)?;

    let processed_payload = process_payload(&config, payload)?;

    let price = processed_payload.values[0];
    let price_account = &mut ctx.accounts.price_account;

    UpdateTimestampVerifier::verifier(&ctx.accounts.user.key(), &SOLANA_CONFIG.trusted_updaters)
        .verify_timestamp(
            block_timestamp,
            price_account.write_timestamp.map(Into::into),
            SOLANA_CONFIG.min_interval_between_updates_ms.into(),
            price_account.timestamp.into(),
            processed_payload.timestamp.into(),
        )?;

    price_account.value = price.0;
    price_account.timestamp = processed_payload.timestamp.as_millis();
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
