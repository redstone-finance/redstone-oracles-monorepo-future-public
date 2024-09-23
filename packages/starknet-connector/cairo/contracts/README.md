# RedStone oracles integration with Starknet

<!-- TOC -->
-[RedStone oracles integration with Starknet](#redstone-oracles-integration-with-starknet)
- [💡 How RedStone oracles work with Starknet](#-how-redstone-oracles-work-with-starknet)
  - [📄 Smart Contracts](#-smart-contracts)
    - [Price adapter](#price-adapter)
    - [⨐ constructor](#-constructor)
      -[⨗ get_prices](#-get_prices)
      -[⨒ write_prices](#-write_prices)
      -[⨗ read_prices](#-read_prices)
      -[∮ read_timestamp](#-read_timestamp)
  - [⚠ Possible transaction failures](#-possible-transaction-failures)
  - [🙋‍Contact](#contact)
<!-- TOC -->

## 💡 How RedStone oracles work with Starknet

_RedStone Oracles_ use an alternative design of providing oracle data to smart contracts. Instead of constantly
persisting data on the contract's storage (by data providers), the information is brought on-chain only when needed
(by end users). Until that moment data remains in the decentralized cache layer, which is powered by RedStone light
cache gateways and streamr data broadcasting protocol. Data is transferred to the contract by end users, who should
attach signed data packages to their function invocations. The information integrity is verified on-chain through
signature checking.

To learn more about _RedStone Oracles_ design, go to the [RedStone docs](https://docs.redstone.finance/docs/introduction)

## 📄 Smart Contracts

### Price adapter

- Sample oracle contract that consumes RedStone oracles
  data - [price_adapter.cairo](./price_adapter/src/price_adapter.cairo) written in cairo version
  2.6.3.

#### ⨐ constructor

```cairo
#[constructor]
fn constructor(
  ref self: ContractState, signer_count_threshold: felt252, signer_addresses: Array<felt252>
)
```

As mentioned above, signature checking is verifying the data packages transferred to the contract.
To be counted to achieve the `signer_count_threshold`, the signer signing the passed data
should be one of the `signer_addresses` passed in the constructor.
There is also needed `signer_count_threshold` to be passed.

📖
The [sample/showroom](https://sepolia.starkscan.co/contract/0x0037b17a782f5a0134bd21faf200f35c96b436dc3af51f5534aa69fd4261bec9)
contract deployed uses single value `0xf786a909D559F5Dee2dc6706d8e5A81728a39aE9`
as a signer address (of the `redstone-rapid-demo` data service) and `1` as `signer_count_threshold`.

In the function parameters below, each `feed_id` is a cairo-represented string, so that's a `felt252` corresponding to
the string written in cairo:
a number consisting of hex-values of the particular letters in the string. For example:
`ETH` as a `feed_id`'s `felt252` is `0x455448` in hex or `4543560` in decimal,
as `256*256*ord('E')+256*ord('T')+ord('H')`.
<br />

📟 You can use: `feed_id = hexlify(toUtf8Bytes(feed_string))` to convert particular values or
the https://cairo-utils-web.vercel.app/ endpoint<br />
📟 You can also use: https://cairo-utils-web.vercel.app/ to convert particular values. <br />

The value `payload_data` is passed as an array of bytes representing the packed RedStone payload.
<br />
📚 See RedStone data-packing: https://docs.redstone.finance/img/payload.png

#### ⨗ get_prices

```cairo
#[external(v0)]
fn get_prices(
    self: @ContractState, feed_ids: Array<felt252>, payload_bytes: Array<u8>
) -> Array<felt252>
```

The function processes on-chain the `payload_data` passed as an argument
and returns an array of aggregated values of each feed passed as an identifier inside `feed_ids`.
That's just a @view function—it doesn't consume GAS or modify the contract's storage.

#### ⨒ write_prices

```cairo
#[external(v0)]
fn write_prices(ref self: ContractState, feed_ids: Array<felt252>, payload_bytes: Array<u8>) {
```

Besides on-the-fly processing, there is also a function that processes the `payload` on-chain.
This function saves the aggregated values to the contract's storage.
The values persist in the contract's storage and then can be read by using [`read_prices`](#-read_prices) functions.
The timestamp of the last saved data can be retrieved using the [`read_timestamp`](#-read_timestamp) function.
The function modifies the storage and consumes GAS.

📖 See how it works on: https://starknet-showroom.redstone.finance/

#### ⨗ read_prices

```cairo
#[external(v0)]
fn read_prices(self: @ContractState, feed_ids: Array<felt252>) -> Array<felt252>
```

The function reads the values persisting in the contract's storage and returns an array corresponding to the
passed `feed_ids`.
The function doesn't modify the storage and can read only aggregated values of the `feed_ids` saved by
using [`write_prices`](#-write_prices) function.

#### ∮ read_timestamp

```rust
#[external(v0)]
fn read_timestamp(self: @ContractState) -> felt252
```

Returns the timestamp of data last saved/written to the contract's storage by using [`write_prices`](#-write_prices)
function.

## ⚠ Possible transaction failures

- The number of signers recovered from the signatures matched with `signer_addresses` passed in the constructor
  must be greater or equal that the `signer_count_threshold` in the constructor, for each feed.
- The timestamp of data-packages must be not older or never than 15 minutes in relation to the `get_block_timestamp`.
- The [`write_prices`](#-write_prices) function consumes gas and must be paid by (sepolia)ETHers. The data are available
  on the contract just after the transaction is accepted on L2.

## 🙋‍Contact

Please feel free to contact us on [Discord](https://redstone.finance/discord) or email to core@redstone.finance
