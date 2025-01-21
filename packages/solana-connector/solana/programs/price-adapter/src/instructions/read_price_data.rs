use crate::state::PriceData;
use crate::state::ValueBs;
use crate::util::make_price_seed;
use crate::FeedIdBs;
use anchor_lang::prelude::*;

pub type PriceAndTimestamp = (ValueBs, u64);

#[derive(Accounts)]
#[instruction(feed_id: FeedIdBs)]
pub struct ReadPrice<'info> {
    #[account(
        seeds = [
            &make_price_seed(),
            &feed_id
        ],
        bump,
        constraint = price_account.to_account_info().owner == __program_id
    )]
    pub price_account: Account<'info, PriceData>,
}

pub fn price_and_timestamp(ctx: Context<ReadPrice>) -> PriceAndTimestamp {
    let data = &ctx.accounts.price_account;

    let price = data.value;
    let timestamp = data.timestamp;

    (price, timestamp)
}

pub fn price(ctx: Context<ReadPrice>) -> ValueBs {
    ctx.accounts.price_account.value
}

pub fn timestamp(ctx: Context<ReadPrice>) -> u64 {
    ctx.accounts.price_account.timestamp
}
