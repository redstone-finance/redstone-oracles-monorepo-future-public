# RedStone Oracles integration with Radix

<!-- TOC -->

- [RedStone Oracles integration with Radix](#redstone-oracles-integration-with-radix)
  -[💡 How RedStone Oracles work with Radix](#-how-redstone-oracles-work-with-radix)
  -[✨ General parameter disclaimer](#-general-parameter-disclaimer)
  -[📄 Blueprints](#-blueprints)
  -[PriceAdapter](#priceadapter)
  - [⨐ instantiate](#-instantiate)
  - [⨗ get_prices](#-get_prices)
  - [⨒ write_prices](#-write_prices)
  - [⨗ read_prices](#-read_prices)
  - [∮ read_timestamp](#-read_timestamp)
      -[📖 Sample payload](#-sample-payload)
      -[⚠ Possible transaction failures](#-possible-transaction-failures)
      -[🙋‍Contact](#contact)

<!-- TOC -->

## 💡 How RedStone Oracles work with Radix

_RedStone Oracles_ use an alternative design of providing oracle data to smart contracts. Instead of constantly
persisting data on the contract's storage (by data providers), the information is brought on-chain only when needed
(by end users).
Until that moment data remains in the decentralized cache layer, which is powered by RedStone light cache gateways and
streamr data broadcasting protocol. Data is transferred to the contract by end users, who should attach signed data
packages to their function invocations. The information integrity is verified on-chain through signature checking.

To learn more about _RedStone Oracles_ design, go to
the [RedStone docs](https://docs.redstone.finance/docs/introduction)

## ✨ General parameter disclaimer

In the function parameters below, each `feed_id` is a `Vec<u8>` as the byte-representation of the string.
The value of `feed_ids` should be passed as a serialized `Vec` of `Vec<u8>`s. \
The returning values are encoded as `U256Digits` represented each as four `u64`'s, to be properly represented in SBOR. \
The value `payload` is a `Vec` of `u8`s representing the serialized RedStone payload.

📚 See RedStone data-packing: https://docs.redstone.finance/img/payload.png and the [Sample payload](#-sample-payload)
section below.

📚 See also [types.rs](src/types.rs) to check which types are changed for the `resim` environment.

## 📄 Blueprints

### PriceAdapter

- Sample oracle contract that consumes _RedStone Oracles_ data [prices.sw](src/price_adapter.rs) written in scrypto
  version `1.2.0`.

#### ⨐ instantiate

That initializer instantiates the component.

```rust
pub fn instantiate(signer_count_threshold: u8, allowed_signer_addresses: Signers) -> Global<PriceAdapter>;
```

As mentioned above, signature checking is verifying the data packages transferred to the contract.
To be counted to achieve the `signer_count_threshold`, the signer signing the passed data
should be one of the `allowed_signer_addresses` passed in the initializer.
There is also needed `signer_count_threshold` to be passed.

#### ⨗ get_prices

```rust
pub fn get_prices(&mut self, feed_ids: FeedIds, payload: Payload) -> (u64, Vec<U256Digits>)
```

The function processes on-chain the `payload` passed as an argument
and returns an array of aggregated values of each feed passed as an identifier inside `feed_ids`,
and a timestamp related to the payload data packages.

That function doesn't modify the contract's storage.

#### ⨒ write_prices

```rust
pub fn write_prices(&mut self, feed_ids: FeedIds, payload: Payload) -> (u64, Vec<U256Digits>)
```

Besides on-the-fly processing, there is also a function that processes the `payload` on-chain.
This function saves the aggregated values to the contract's storage and returns them as an array.
The values persist in the contract's storage and then can be read by using `read_prices` function.
The timestamp of the last saved data can be retrieved using the `read_timestamp` function.
The function also returns the saved timestamp and price values.

That function modifies the contract's storage.

📖 See how it works on: https://fuel-showroom.redstone.finance/

#### ⨗ read_prices

```rust
pub fn read_prices(&mut self, feed_ids: FeedIds) -> Vec<U256Digits>
```

The function reads the values persisting in the contract's storage and returns an array corresponding to the
passed `feed_ids`.
The function doesn't modify the storage and can read only aggregated values of the `feed_ids` saved by
using `write_prices` function.

That function doesn't modify the contract's storage.

#### ∮ read_timestamp

```rust
pub fn read_timestamp(&mut self)
```

Returns the timestamp of data last saved/written to the contract's storage by using `write_prices` function.

That function doesn't modify the contract's storage.

## 📖 Sample payload

See [here](../README.md#preparing-sample-data), how to generate it.

Then the hex response is necessary to be split to single bytes, for example, by using `Array.from(arrayify(payloadHex))`
functions of `ethers` node package, and converted to SBOR, by using one of helpers functions like
defined [here](../../src/radix/utils.ts).

## ⚠ Possible transaction failures

The transaction could have returned an error, one of the defined below:

- in the [redstone](../rust-sdk/src/network/error.rs) library, or see
  in [docs](https://docs.redstone.finance/rust/redstone/crypto_secp256k1,network_radix/redstone/network/error/enum.Error.html)

- Price Adapter [specific](../price_adapter/src/price_adapter_error.rs)

## 🙋‍Contact

Please feel free to contact us on [Discord](https://redstone.finance/discord) or email to core@redstone.finance
