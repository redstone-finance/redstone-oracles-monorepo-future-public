# RedStone Blockchain Oracles integration with SUI

<!-- TOC -->
* [RedStone Blockchain Oracles integration with SUI](#redstone-blockchain-oracles-integration-with-sui)
  * [💡 How RedStone Blockchain Oracles work with SUI](#-how-redstone-blockchain-oracles-work-with-sui)
  * [✨ General parameter type disclaimer](#-general-parameter-type-disclaimer)
  * [📄 Contracts](#-contracts)
    * [PriceAdapter](#priceadapter)
      * [⨐ initializer](#-initializer)
      * [⨒ write_price](#-write_price)
      * [⨗ price](#-price)
      * [∮ timestamp](#-timestamp)
      * [∮ price_and_timestamp](#-price_and_timestamp)
      * [∮ price_data](#-price_data)
    * [Upgrade guide](#upgrade-guide)
  * [🙋‍Contact](#contact)
<!-- TOC -->

## 💡 How RedStone Blockchain Oracles work with SUI

_RedStone Blockchain Oracles_ use an alternative design of providing oracle data to smart contracts. Instead of constantly
persisting data on the contract's storage (by data providers), the information is brought on-chain only when needed
(by end users).
Until that moment data remains in the decentralized cache layer, which is powered by RedStone light cache gateways and
streamr data broadcasting protocol. Data is transferred to the contract by end users, who should attach signed data
packages to their function invocations. The information integrity is verified on-chain through signature checking
by using `sui::ecdsa_k1::secp256k1_ecrecover` function.

To learn more about _RedStone Blockchain Oracles_ design, go to
the [RedStone docs](https://docs.redstone.finance/docs/introduction)

## ✨ General parameter type disclaimer

* In the function parameters below, each `feed_id` is a `vector<u8>` as the byte-representation of the string.
  The value of `feed_id`s should be passed as a `vector<u8>`.
* The returning values for `feed_id`s are `u256`s -
* The `payload` value is a `vector` of `u8`s representing the serialized RedStone payload.

📚 See RedStone data-packing: https://docs.redstone.finance/img/payload.png

## 📄 Contracts

### PriceAdapter

- Sample oracle contract that consumes _RedStone Oracles_ data [`sources/main.move`](sources/main.move) written in Move
  version `1.39.0`.

#### ⨐ initializer

That initializer initializes the component.

```sui move
public fun initialize_price_adapter(
    admin_cap: &AdminCap,
    signers: vector<vector<u8>>,
    signer_count_threshold: u8,
    max_timestamp_delay_ms: u64,
    max_timestamp_ahead_ms: u64,
    ctx: &mut TxContext,
)
```

As mentioned above, signature checking is verifying the data packages transferred to the contract.
To be counted to achieve the `signer_count_threshold`, the signer signing the passed data
should be one of the `allowed_signer_addresses` passed in the initializer.
There is also needed `signer_count_threshold` to be passed.

We assume the data timestamp `T` received in the payload is in range
`clock_timestamp - max_timestamp_delay_ms` < `T` <  `clock_timestamp + max_timestamp_ahead_ms`
in relationship to the  `clock_timestamp` taken from the `Clock` object.

#### ⨒ write_price

```sui move
public fun write_price(
  price_adapter: &mut PriceAdapter,
  feed_id: vector<u8>,
  payload: vector<u8>,
  clock: &Clock,
): u256
```

The function processes the `payload` on-chain.
This function saves the aggregated value for the `feed_id`
to the  shared [`PriceData`](./sources/price_data.move) object and returns it.
The values persist in the shared object and then can be read by using [`price`](#-price) function.
The timestamp of the saved data can be retrieved using the [`timestamp`](#-timestamp) function.
That function modifies the shared object.

#### ⨗ price

```sui move
public fun price(price_adapter: &PriceAdapter, feed_id: vector<u8>): u256 
```

The function reads the value persisting in the shared object and returns the value corresponding to the
passed `feed_id`.
The function doesn't modify shared object and can read only aggregated values of the `feed_id` saved by
using one of invocations of [`write_price`](#-write_price) function.

That function doesn't modify the shared object.

#### ∮ timestamp

```sui move
public fun timestamp(price_adapter: &PriceAdapter, feed_id: vector<u8>): u64
```

Returns the timestamp of data last saved/written to the shared [`PriceData`](./sources/price_data.move) object by using [`write_price`](#-write_price) function.
The function doesn't modify shared object and can read only aggregated values of the `feed_id` saved by
using one of invocations of [`write_price`](#-write_price) function.

#### ∮ price_and_timestamp

```sui move
public fun price_and_timestamp(price_adapter: &PriceAdapter, feed_id: vector<u8>): (u256, u64) 
```

#### ∮ price_data

```sui move
public fun price_data(price_adapter: &PriceAdapter, feed_id: vector<u8>): &PriceData
```

Reads the whole  shared [`PriceData`](./sources/price_data.move) object for the passed `feed_id`.

The function doesn't modify the shared object and can read only aggregated values of the `feed_id` saved by
using one of invocations of [`write_price`](#-write_price) function.

### Upgrade guide

See [here](../README.md#sui-package-upgrades)

## 🙋‍Contact

Please feel free to contact us on [Discord](https://redstone.finance/discord) or email to core@redstone.finance
