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

### RedStoneCore

- Sample oracle contract that consumes _RedStone Oracles_ data [redstone_core.sw](src/redstone_core.sw) written in sway version
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
and returns an array of aggregated values for each feed passed as an identifier inside `feed_ids`,
as well as the timestamp of the aggregated prices.

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
