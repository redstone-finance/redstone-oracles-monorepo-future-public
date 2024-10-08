# RedStone Oracles integration with Fuel

## 💡 How RedStone Oracles work with Fuel

_RedStone Oracles_ use an alternative design of providing oracle data to smart contracts. Instead of constantly
persisting data on the contract's storage (by data providers), the information is brought on-chain only when needed
(by end users).
Until that moment data remains in the decentralized cache layer, which is powered by RedStone light cache gateways and
streamr data broadcasting protocol. Data is transferred to the contract by end users, who should attach signed data
packages to their function invocations. The information integrity is verified on-chain through signature checking.

To learn more about _RedStone Oracles_ design, go to the [RedStone docs](https://docs.redstone.finance/docs/introduction)

## 📄 Smart Contracts

### Prices.sway

- Sample oracle contract that consumes _RedStone Oracles_ data [prices.sw](src/prices.sw) written in sway version
  `0.64.0`.

#### Parameters

In the function parameters below, each `feed_id` is a string encoded to `u256` which means, that's a value
consisting of hex-values of the particular letters in the string. For example:
`ETH` as a `u256` is `0x455448` in hex or `4543560` in decimal,
as `256*256*ord('E')+256*ord('T')+ord('H')`.
<br />
📟 You can use: `feed_id = hexlify(toUtf8Bytes(feed_string))` to convert particular values or
the https://cairo-utils-web.vercel.app/ endpoint<br />

The value `payload` is passed as `Bytes` representing the packed RedStone payload.
<br />
📚 See RedStone data-packing: https://docs.redstone.finance/img/payload.png
and the [Sample payload](#-sample-payload) section below.

#### ⨗ get_prices

```rust
#[storage(read)]
fn get_prices(feed_ids: Vec<u256>, payload: Bytes) -> (Vec<u256>, u64)
```

The function processes on-chain the `payload` passed as an argument
and returns an array of aggregated values of each feed passed as an identifier inside `feed_ids`,
as well as the timestamp of the aggregated prices.

That's just a `#[storage(read)]` function - it consumes GAS but doesn't modify the contract's storage.

#### ⨒ write_prices

```rust
#[storage(write)]
fn write_prices(feed_ids: Vec<u256>, payload: Bytes) -> Vec<u256>
```

Besides on-the-fly processing, there is also a function that processes the `payload` on-chain.
This function saves the aggregated values to the contract's storage and returns them as an array.
The values persist in the contract's storage and then can be read by using `read_prices` function.
The timestamp of the saved data can be retrieved using the `read_timestamp` function.
That's a `#[storage(write)]` function - it consumes GAS and modifies the contract's storage.

📖 See how it works on: https://fuel-showroom.redstone.finance/

#### ⨗ read_prices

```rust
#[storage(read)]
fn read_prices(feed_ids: Vec<u256>) -> Vec<Option<u256>>
```

The function reads the values persisting in the contract's storage and returns an array corresponding to the
passed `feed_ids`.
The function doesn't modify the storage and can read only aggregated values of the `feed_ids` saved by
using `write_prices` function, as optionals (`Option::None` for non-existing values).

That's just a `#[storage(read)]` function - it consumes GAS but doesn't modify the contract's storage.

#### ∮ read_timestamp

```rust
#[storage(read)]
fn read_timestamp() -> u64
```

Returns the timestamp of data last saved/written to the contract's storage by using `write_prices` function -
or zero when no data was previously written.

That's just a `#[storage(read)]` function - it consumes GAS but doesn't modify the contract's storage.

## 📖 Sample payload

See [here](../README.md#preparing-sample-data), how to generate it.

Then the hex response is necessary to be split to single bytes, for example, by using `Array.from(arrayify(payloadHex))`
functions of `ethers` node package.

📖 See: [README.md](../README.md) to see the environment possibilities and sample scripts invoking the functions.

To have defined your custom data-service id and signers, [contact us](#contact).

## ⚠ Possible transaction failures

See [here](https://docs.redstone.finance/sway/redstone/core/errors/index.html)

## 🙋‍Contact

Please feel free to contact us on [Discord](https://redstone.finance/discord) or email to core@redstone.finance
