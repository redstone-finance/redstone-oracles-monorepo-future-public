# 🔗 @redstone-finance/radix-connector

[![Discord](https://img.shields.io/discord/786251205008949258?logo=discord)](https://discord.gg/2CT6hN6C)
[![Twitter](https://img.shields.io/twitter/follow/redstone_defi?style=flat&logo=twitter)](https://twitter.com/intent/follow?screen_name=redstone_defi)

Proudly supported by:
[![Radix Grants Program](radix-grants-program.png)](#-the-radix-grants-program)

RedStone proposes a completely new modular design where data is first put into a data availability layer and then
fetched on-chain. This allows us to broadcast a large number of assets at high frequency to a cheaper layer and put it
on chain only when required by the protocol.

The `@redstone-finance/radix-connector` module implements an alternative design of providing oracle data to smart
contracts. Instead of constantly persisting data on the Radix network storage (by data providers), the information is
brought on-chain only when needed (by end users). Until that moment data remains in the decentralised cache layer, which
is powered by RedStone light cache gateways and streamr data broadcasting protocol. Data is transferred to the Radix
network by end users. The information integrity is verified on-chain through signature checking.

Here also you can find the description of
the [whole RedStone Oracle model](https://docs.redstone.finance/docs/introduction).

- [👨‍💻 Code structure](#-code-structure)
- [🔥 Connecting to the contract](#-connecting-to-the-contract)
- [⚡ The Radix Grants Program](#-the-radix-grants-program)
- [📄 License](#-license)

## 👨‍💻 Code structure

- [scrypto](scrypto) directory contains the radix-network on-chain libraries written in scrypto `1.3.0`.
  - There are also various tests of signature verification with the given signers, timestamp validation, value
      aggregation as well as full data-processing tests with various configurations.
  - You can find all the possibilities [here](scrypto/README.md).
  - You can read [here](scrypto/contracts/price_adapter/README.md) how the contract works.
- [src](src) directory contains the TypeScript classes, useful for establishing a connection between TypeScript and
  Radix-network layers.
  - See [below](#-connecting-to-the-contract), how to connect to the contract.
- [test](test) directory contains the off-chain component tests

## 🔥 Connecting to the contract

First, you need to import the connector code to your project

```ts
// Typescript
import {PriceAdapterRadixContractConnector, RadixClient} from "@redstone-finance/radix-connector";
import {ContractParamsProvider} from "@redstone-finance/sdk";

// Javascript
const {
  PriceAdapterRadixContractConnector,
  RadixClient
} = require("@redstone-finance/radix-connector");
const {ContractParamsProvider} = require("@redstone-finance/sdk");
```

Then you can invoke the contract methods described above pointing to the
selected [RedStone data service](https://app.redstone.finance) and requested data feeds.

```ts
const client = new RadixClient(NetworkId.Stokenet, {
  ed25519: yourWalletPrivateKey
});
const prices = new PriceAdapterRadixContractConnector(client, yourComponentId);

const paramsProvider = new ContractParamsProvider({
  dataServiceId: "redstone-main-demo",
  uniqueSignersCount: 1,
  dataPackagesIds: ["ETH", "BTC"],
});
```

Now you can access any of the contract's methods by invoking the code:

```ts
(await prices.getAdapter()).getPricesFromPayload(paramsProvider);
(await prices.getAdapter()).writePricesFromPayloadToContract(paramsProvider);
(await prices.getAdapter()).readPricesFromContract(paramsProvider);
(await prices.getAdapter()).readTimestampFromContract();
```

### Installing the dependencies

```bash
yarn install
```

## ⚡ The Radix Grants Program

Helping developers and entrepreneurs go from idea to breakout project on the Radix network.
[Read more here](https://developers.radixdlt.com/grants)

## 📄 License

RedStone Radix connector is an open-source and free software released under the BUSL-1.1 License.
