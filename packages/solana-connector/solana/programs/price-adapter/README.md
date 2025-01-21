# RedStone Blockchain Oracles integration with Solana

<!-- TOC -->
* [RedStone Blockchain Oracles integration with Solana](#redstone-blockchain-oracles-integration-with-solana)
  * [💡 How RedStone Blockchain Oracles work with Solana](#-how-redstone-blockchain-oracles-work-with-solana)
  * [✨ General parameter type disclaimer](#-general-parameter-type-disclaimer)
  * [📄 Contracts](#-contracts)
    * [PriceAdapter](#priceadapter)
      * [⨐ initializer](#-initializer)
      * [⨒ write_price](#-write_price)
      * [⨗ price](#-price)
      * [∮ timestamp](#-timestamp)
      * [∮ price_and_timestamp](#-price_and_timestamp)
  * [🙋‍Contact](#contact)
<!-- TOC -->

## 💡 How RedStone Blockchain Oracles work with Solana

_RedStone Blockchain Oracles_ use an alternative design of providing oracle data to smart contracts. Instead of constantly
persisting data on the contract's storage (by data providers), the information is brought on-chain only when needed
(by end users).
Until that moment data remains in the decentralized cache layer, which is powered by RedStone light cache gateways and
streamr data broadcasting protocol. Data is transferred to the contract by end users, who should attach signed data
packages to their function invocations. The information integrity is verified on-chain through signature checking
by using `anchor_lang::solana_program::secp256k1_recover::secp256k1_recover` function.

To learn more about _RedStone Blockchain Oracles_ design, go to
the [RedStone docs](https://docs.redstone.finance/docs/introduction)

## ✨ General parameter type disclaimer

* In the function parameters below, each `feed_id` is a `vector<u8>` as the byte-representation of the string.
  The value of `feed_id`s should be passed as a `vector<u8>`.
* The returning values for `feed_id`s are bytes `[u8; 32]` representing u256 value in big endian order -
* The `payload` value is a `vector` of `u8`s representing the serialized RedStone payload.

📚 See RedStone data-packing: https://docs.redstone.finance/img/payload.png

## 📄 Contracts

### PriceAdapter

- Sample oracle contract that consumes _RedStone Oracles_ data [`src/lib.rs`](src/lib.rs) written in Rust.

#### ⨐ initializer

That initializer initializes the config component.

```rust
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
```

As mentioned above, signature checking is verifying the data packages transferred to the contract.
To be counted to achieve the `signer_count_threshold`, the signer signing the passed data
should be one of the `signers` passed in the initializer.
There is also needed `signer_count_threshold` to be passed.

We assume the data timestamp `T` received in the payload is in range
`clock_timestamp - max_timestamp_delay_ms` < `T` <  `clock_timestamp + max_timestamp_ahead_ms`
in relationship to the  `clock_timestamp` taken from the `Clock` object.

#### ⨒ write_price

```rust
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

pub fn write_price(ctx: Context<WritePrice>, feed_id: FeedIdBs, payload: Vec<u8>) -> Result<()>
```

The function processes the `payload` on-chain.
This function saves the aggregated value for the `feed_id`
to the [`PriceData`](./src/state.rs) object and returns it.
The values persist in the account object and then can be read by using [`price`](#-price) function or directly read on from the [`PriceData`](./src/state.rs) object.
The timestamp of the saved data can be retrieved using the [`timestamp`](#-timestamp) function.
That function modifies the [`PriceData`](./src/state.rs) object.

#### ⨗ price

```rust
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

pub fn price(ctx: Context<ReadPrice>) -> ValueBs
```

The function reads the value persisting in the object and returns the value corresponding to the
passed `feed_id`.
The function doesn't modify object and can read only aggregated values of the `feed_id` saved by
using one of invocations of [`write_price`](#-write_price) function.

That function doesn't modify the shared object.

#### ∮ timestamp


```rust
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

pub fn timestamp(ctx: Context<ReadPrice>) -> u64
```

Returns the timestamp of data last saved/written to the shared [`PriceData`](./src/state.rs) object by using [`write_price`](#-write_price) function.
The function doesn't modify shared object and can read only aggregated values of the `feed_id` saved by
using one of invocations of [`write_price`](#-write_price) function.

#### ∮ price_and_timestamp


```rust
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

pub fn price_and_timestamp(ctx: Context<ReadPrice>) -> (ValueBS, u64)
```

## 🙋‍Contact

Please feel free to contact us on [Discord](https://redstone.finance/discord) or email to core@redstone.finance
