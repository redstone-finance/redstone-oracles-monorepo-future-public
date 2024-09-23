# RedStone Oracles integration with Casper

<!-- TOC -->
- [RedStone Oracles integration with Casper](#redstone-oracles-integration-with-casper)
  - [💡 How RedStone Oracles work with Casper](#-how-redstone-oracles-work-with-casper)
  - [✨ General parameter disclaimer](#-general-parameter-disclaimer)
  - [📄 Smart Contracts](#-smart-contracts)
    - [Price Adapter](#price-adapter)
      - [⨐ init](#-init)
      - [⨗ get_prices](#-get_prices)
      - [⨒ write_prices](#-write_prices)
      - [⨗ read_prices](#-read_prices)
      - [∮ read_timestamp](#-read_timestamp)
      - [∮ read_price_and_timestamp](#-read_price_and_timestamp)
    - [Price Relay Adapter](#price-relay-adapter)
      - [⛔ JsonRPC Casper API limitations](#-jsonrpc-casper-api-limitations)
      - [The reason for creating the Relay Adapter](#the-reason-for-creating-the-relay-adapter)
      - [⨐ init](#-init-1)
      - [⨗ get_prices](#-get_prices-1)
      - [∯ write_prices_chunk](#-write_prices_chunk)
      - [∯ get_prices_chunk](#-get_prices_chunk)
    - [Price Feed](#price-feed)
      - [⨐ init](#-init-2)
    - [∮ get_price_and_timestamp](#-get_price_and_timestamp)
    - [Sample payload](#sample-payload)
  - [⚠ Possible transaction failures](#-possible-transaction-failures)
  - [🙋‍Contact](#contact)
<!-- TOC -->

## 💡 How RedStone Oracles work with Casper

_RedStone Oracles_ use an alternative design of providing oracle data to smart contracts. Instead of constantly
persisting data on the contract's storage (by data providers), the information is brought on-chain only when needed
(by end users). Until that moment data remains in the decentralized cache layer, which is powered by RedStone light
cache gateways and streamr data broadcasting protocol. Data is transferred to the contract by end users, who should
attach signed data packages to their function invocations. The information integrity is verified on-chain through
signature checking.

To learn more about _RedStone Oracles_ design, go to the [RedStone docs](https://docs.redstone.finance/docs/introduction)

## ✨ General parameter disclaimer

In the function parameters below, each `feed_id` is a serialized `U256` which means, that's a value
consisting of hex-values of the particular letters in the string. For example:
`'ETH'` as an `int` is `0x455448` in hex or `4543560` in decimal, as `256*256*ord('E')+256*ord('T')+ord('H')`.
<br />
📟 You can use: `feed_id = hexlify(toUtf8Bytes(feed_string))` to convert particular values or
the https://cairo-utils-web.vercel.app/ endpoint<br />

The value of `feed_ids` should be passed as a serialized `List` of `U256`s.\
📚 See [Casper Client args examples](../scripts/args/args-examples)
or [an example json](../scripts/args/adapter-init-args.json).

The value `payload` is a serialized `List` of `U8`s representing the serialized RedStone payload.
<br />
📚 See RedStone data-packing: https://docs.redstone.finance/img/payload.png

📚 See also the file [constants.fc](../redstone_casper/src/contracts/constants.rs), containing all necessary
constants.

## 📄 Smart Contracts

### [Price Adapter](price_adapter)

Sample oracle contract that consumes _RedStone Oracles_ data, written in Rust.
The example-testnet address of the implementation is exposed in the [DEPLOYED.hex](price_adapter/DEPLOYED.hex) file.

☔ Due to the method calling limitations in the TypeScript Casper SDK,
see also the [Price Relay Adapter](#price-relay-adapter).

#### ⨐ init

```rust
init(signer_count_threshold: U8, signers: List[List[U8]]): Unit     // Group([GROUP_NAME_OWNER])/Contract
```

As mentioned above, signature checking is verifying the data packages transferred to the contract.
To be counted to achieve the `signer_count_threshold`, the signer signing the passed data
should be one of the `signers` passed in the parameters. There is also needed `signer_count_threshold` to be
passed.

The `init` function must be executed by the contract creator in the Contract context.

The value of `signers` should be passed as a serialized `List` of `U8`-`List`'.\
📚 See [Casper Client args examples](../scripts/args/args-examples)
or [an example json](../scripts/args/adapter-init-args.json).

To define the initial data for the contract, use for example:

```rust
fn price_adapter_init(signers: Vec<Bytes>, signer_count_threshold: u8) {
    let args = runtime_args! {
        ARG_NAME_SIGNERS => signers,
        ARG_NAME_SIGNER_COUNT_THRESHOLD => signer_count_threshold
    };

    call_entry_point(ENTRY_POINT_INIT, args);
}
```

#### ⨗ get_prices

```rust
get_prices(feed_ids: List[U256], payload: List[U8]): Tuple2     // Public/Contract
```

The function process on-chain the `payload` passed as an argument and returns a `Tuple2` of aggregated values
(of each feed passed as an identifier inside `feed_ids`) and the min timestamp of the data.

The method doesn't modify the contract's storage.

⛔ Due to calling [limitations](#-jsonrpc-casper-api-limitations) **off-chain**, the method must be called by
the [Price Relay Adapter](#price-relay-adapter).

#### ⨒ write_prices

```rust
write_prices(feed_ids: List[U256], payload: List[U8]): Tuple2     // Public/Contract
```

Besides on-the-fly processing, there is also a function that processes the `payload` on-chain.
This function saves the aggregated values to the contract's storage.
The values persist in the contract's storage and then can be read by using [`read_prices`](#-read_prices) function.
The timestamp of data last saved/written to the contract is able to read by using
the [`read_timestamp`](#-read_timestamp) function.

The method returns the `Tuple2` value as the [`get_prices`](#-get_prices) function.

The method modifies the contract's storage.

[//]: "📖 See how it works on: https://casper-showroom.redstone.finance/"

#### ⨗ read_prices

```rust
read_prices(feed_ids: List[U256]): List[U256]     // Public/Contract
```

The function reads the values persisting in the contract's storage and returns a `List` of `U256`-values corresponding
to the passed `feed_ids`.
The function can read only aggregated values of the `feed_ids` saved by using [`write_prices`](#-write_prices) function.

The method doesn't modify the contract's storage.

⛔ Due to calling [limitations](#-jsonrpc-casper-api-limitations) **off-chain**, the values must be read one-by-one by
using the `STORAGE_KEY_VALUES` dictionary with a key representing the ascii string of the `feed_id`, `ETH` for example.

#### ∮ read_timestamp

```rust
read_timestamp(): U64     // Public/Contract
```

Returns the timestamp of data last saved/written to the contract's storage by using [`write_prices`](#-write_prices)
function.

The method doesn't modify the contract's storage.

⛔ Due to calling [limitations](#-jsonrpc-casper-api-limitations) **off-chain**, the timestamp must be read by
using the `STORAGE_KEY_TIMESTAMP` item.

#### ∮ read_price_and_timestamp

```rust
read_price_and_timestamp(feed_id: U256): Tuple2     // Public/Contract
```

The function reads the value persisting in the contract's storage and returns a `Tuple2` containing a `U256`-value
(corresponding to the passed `feed_id`) and the timestamp of data last saved/written to the contract's storage by
using [`write_prices`](#-write_prices) function

The method doesn't modify the contract's storage.

### [Price Relay Adapter](price_relay_adapter)

The example-testnet address of the implementation is exposed in the [DEPLOYED.hex](price_relay_adapter/DEPLOYED.hex)
file.

##### ⛔ JsonRPC Casper API limitations

- The current version of JsonRpc Casper API has a limit of 1024 bytes for a total length of the serialized function
  parameters.
- The latest (`2.15.5`) version of
  TypeScript [`casper-js-sdk`](https://github.com/casper-ecosystem/casper-js-sdk/tree/release-2.15.4) library is a
  wrapper for the JsonRpc method of interacting with Casper.
- This means, in the off-chain way of calling contracts, the payload size must have been limited to 875 bytes in a
  single
  `deploy` (transaction).
- Also, there's no possibility to get the values returned by the `deploy` (transaction) in the off-chain method of
  interacting with the Casper contracts.

##### The reason for creating the Relay Adapter

That above is the reason for having created the Price _Relay Adapter_, which:

- it's just a proxy for the regular price adapter methods:
  - [`write_prices`](#-write_prices)
  - [`read_timestamp`](#-read_timestamp)
  - [`read_prices`](#-read_prices)
- it solves the limitation of calling [`get_prices`](#-get_prices) method off-chain
- it adds a set of methods for passing the `payload` argument in chunks

☕ The contract **doesn't need** to be used for **on-chain-only usage** of the environment.

#### ⨐ init

```rust
init(adapter_address: Key): Unit     // Group([GROUP_NAME_OWNER])/Contract
```

As mentioned above, the contract is a proxy for a regular [`Price Adapter`](#price-adapter),
so the `adapter_address` parameter needs to be passed as a `Key` of the proxied adapter
(the one with the `hash-...` format).

The `init` function must be executed by the contract creator in the Contract context.

To define the initial data for the contract, use for example:

```rust
fn price_relay_adapter_init(adapter_key: Key) {
    let args = runtime_args! {
            ARG_NAME_ADAPTER_ADDRESS => adapter_key
        };

    call_entry_point(ENTRY_POINT_INIT, args);
}
```

The function must be executed by the contract creator in the Contract context and only once.

#### ⨗ get_prices

```rust
get_prices(feed_ids: List[U256], payload: List[U8]): Tuple2     // Public/Contract
```

To solve the impossibility to get the values returned by the `deploy` (transaction) in the off-chain method of
interacting with the Casper contracts, the function calls the original [`get_prices`](#-get_prices) method on the
proxied adapter and then saves the value to the _Relay Adapter_'s storage.

To be more precise, it counts the _blake2b256_ hash of the `payload` data and adds the result as
a `ComputedValue` (`Tuple3`), which contains the `timestamp`, `feed_ids` and `values`, as defined below.

```rust
type ComputedValue = (u64, Vec<U256>, Vec<U256>);
```

The data can be read then off-chain by using `STORAGE_KEY_VALUES` dictionary by passing the _blake2b256_ hash
of the `payload` as a key.
The dictionary contains all previously computed values, so its every item is a `Vec<ComputedValue>`-list,
having the lastly computed value on its end.

The function avoids of multiple calls of the original [`get_prices`](#-get_prices) method when one of computed values
contains a set/superset of `feed_ids` computed previously for the particular `payload`, but still adds a copy
of the returned values on the end of the list (in case on superset, intersects it with the passed `feed_ids`).

...

#### ∯ write_prices_chunk

```rust
write_prices_chunk(feed_ids: List[U256], payload: List[U8],
                   hash: List[U8], chunk_index: U8): Unit     // Public/Contract
```

The function temporarily saves the chunk of `payload` to a contract storage, taking into account the `chunk_index` and
the _blake2b256_ `hash` of the whole `payload` to be sent (**not** the hash of the chunk).
The chunks can be overwritten or resent when, for example, the `deploy` fails/panics. When the method detects that all
chunks were saved, it automatically calls the original [`write_prices`](#-write_prices) method on the proxied adapter.

The max number of chunks is 8. Also, the previously saved `payload` can be reused, by passing, for example, an empty
chunk as the `payload` and any `chunk_index` greater than the number of chunks, to not have overwritten the previously
saved chunk with the empty chunk.

#### ∯ get_prices_chunk

```rust
get_prices_chunk(feed_ids: List[U256], payload: List[U8],
                   hash: List[U8], chunk_index: U8): Unit     // Public/Contract
```

The function works as the [`write_prices_chunk`](#-write_prices_chunk) function, but also saves the result as
the [`get_prices`](#-get_prices-1) function.

### [Price Feed](price_feed)

Sample consumer of the data saved in [Price Adapter](#price-adapter) or of its wrapped
version [Price Relay Adapter](#price-relay-adapter)
The example-testnet address of the implementation is exposed in the [DEPLOYED.hex](price_feed/DEPLOYED.hex) file.

#### ⨐ init

```rust
init(adapter_address: Key, feed_id: U256): Unit     // Group([GROUP_NAME_OWNER])/Contract
```

As mentioned above, the contract reads data from the adapter, so the `adapter_address` parameter needs to be passed
as a `Key` (the one with the `hash-...` format).
There is also needed the `feed_id` the value will be fetched for.

The function must be executed by the contract creator in the Contract context and only once.

#### ∮ get_price_and_timestamp

```rust
get_price_and_timestamp(): Tuple2;
```

Returns the value and timestamp of the last saved/written data to the adapter's storage by
calling [`get_price_and_timestamp`](#-get_price_and_timestamp) for the `feed_id` initialized during [`init`](#-init-2).

The method saves the fetched value and timestamp in the contract's storage.

⛔ Due to calling [limitations](#-jsonrpc-casper-api-limitations) **off-chain**, the value and the timestamp must be read
by using the `STORAGE_KEY_VALUE` and `STORAGE_KEY_TIMESTAMP` items.

### Sample payload

See [here](../README.md#preparing-sample-data).

## ⚠ Possible transaction failures

The transaction could have returned a `UserError: [code]` with one of codes defined:

* in the [redstone](../rust-sdk/src/network/error.rs) library, or see
  in [docs](https://redstone-docs-git-casper-redstone-finance.vercel.app/rust/casper/redstone/crypto_secp256k1,network_casper/redstone/network/error/enum.Error.html)
- commonly used
  across [contracts](https://redstone-docs-git-casper-redstone-finance.vercel.app/rust/casper/redstone/crypto_secp256k1,network_casper/redstone/network/casper/contracts/contract_error/enum.ContractError.html)
- Price Adapter [specific](../contracts/price_adapter/src/price_adapter_error.rs)

## 🙋‍Contact

Please feel free to contact us on [Discord](https://redstone.finance/discord) or email core@redstone.finance
