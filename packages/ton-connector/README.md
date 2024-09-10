# 🔗 @redstone-finance/ton-connector

[![Discord](https://img.shields.io/discord/786251205008949258?logo=discord)](https://discord.gg/2CT6hN6C)
[![Twitter](https://img.shields.io/twitter/follow/redstone_defi?style=flat&logo=twitter)](https://twitter.com/intent/follow?screen_name=redstone_defi)

RedStone proposes a completely new modular design where data is first put into a data availability layer and then
fetched on-chain. This allows us to broadcast a large number of assets at high frequency to a cheaper layer and put it
on
chain only when required by the protocol.

The `@redstone-finance/ton-connector` module implements an alternative design of providing oracle data to smart
contracts. Instead of constantly persisting data on the TON network storage (by data providers), the information is
brought on-chain only when needed (by end users). Until that moment data remains in the decentralised cache layer, which
is powered by RedStone light cache gateways and streamr data broadcasting protocol. Data is transferred to the TON
network by end users. The information integrity is verified on-chain through signature checking.

Here also you can find the description of
the [whole RedStone Oracle model](https://docs.redstone.finance/docs/introduction).

- [👨‍💻 Code structure](#-code-structure)
- [🔥 Connecting to the contract](#-connecting-to-the-contract)
- [⚡ The TON Grants Program](#-the-ton-grants-program)
- [📄 License](#-license)

## 👨‍💻 Code structure

The code structure is defined by the Blueprint the
assumptions [described here](https://github.com/ton-org/blueprint/blob/main/README.md) -
Blueprint is a development environment for TON blockchain for writing, testing, and deploying smart contracts.

- [contracts](contracts) - source code in FunC for all smart contracts and their imports.
  - You can read [here](contracts/README.md) how the contracts work.
  - [redstone](contracts/redstone) directory contains the RedStone library containing aggregation as well as full
    data-processing written in FunC
- [wrappers](wrappers) - TypeScript interface classes for all contracts (implementing Contract from @ton/core)
  include message (de)serialization primitives, getter wrappers and compilation functions
  used by the test suite and client code to interact with the contracts from TypeScript
- [scripts](scripts) - deployment scripts to mainnet/testnet and other scripts interacting with live contracts
  - [deployPriceFeed.ts](scripts/deployPriceFeed.ts) / [deployPriceManager.ts](scripts/deployPriceManager.ts) deploy
    the particular contract on testnet
  - [runPriceManagerGetPrices.ts](scripts/runPriceManagerGetPrices.ts) / [runPriceManagerReadPrices.ts](scripts/runPriceManagerReadPrices.ts) / [runPriceManagerWritePrices.ts](scripts/runPriceManagerWritePrices.ts)
    execute the methods described [here](contracts/README.md#price_managerfc-vel-prices)
  - [runPriceFeedFetchData.ts](scripts/runPriceFeedFetchData.ts) / [runPriceFeedGetData.ts](scripts/runPriceFeedGetData.ts)
    execute the methods described [here](contracts/README.md#price_feedfc)
- [src](src) - TypeScript classes, useful for establishing a connection between TypeScript and TON layers.
  - See [below](#-connecting-to-the-contract), how to connect to the contract.
- [test](test) - TypeScript test suite for all contracts (relying on Sandbox for in-process tests):
  - ![TODO](assets/to-do-list.png) TBD

## 🔥 Connecting to the contract

First, you need to import the connector code to your project

```ts
// Typescript
import { TonPricesContractConnector } from "@redstone-finance/ton-connector";
import { ContractParamsProvider } from "@redstone-finance/sdk";

// Javascript
const {
  TonPricesContractConnector,
} = require("@redstone-finance/ton-connector");
const { ContractParamsProvider } = require("@redstone-finance/sdk");
```

Then you can invoke the contract methods described above pointing to the
selected [RedStone data service](https://app.redstone.finance) and requested data feeds.

```ts
const prices = new TonPricesContractConnector(network, yourContractAddress);

const paramsProvider = new ContractParamsProvider({
  dataServiceId: "redstone-main-demo",
  uniqueSignersCount: 1,
  dataPackagesIds: ["ETH", "BTC"],
});
```

The `network` param is needed to be passed because of different ways of configuring TON network access.
If you're using Blueprint or have another custom way, just define the `network` param as below.
Note: the `@ton/blueprint` is not a dependency of the library, so you need to add to your project manually.

```ts
const blueprintNetwork = new BlueprintTonNetwork(networkProvider, apiV2Config);

// or

const customNetwork = new CustomTonNetwork(() => {
  return null; /* return your wallet KeyPair here */
}, apiV2Config);
```

and `apiV2Config` should contain `apiEndpoint` and `apiKey` (when is needed, for example
for https://toncenter.com) strings. The `apiEndpoint` can be fetched by using `getHttpEndpoint({ network: "testnet" })`
method for orbs or can be defined as `https://testnet.toncenter.com/api/v2/jsonRPC` for toncenter.

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

## ⚡ The TON Grants Program

TON Foundation provides grants for projects that contribute to TON core infrastructure and introduce new practical use
cases and is helping hundreds of builders to battle-test their skills and knowledge while contributing to public good.

[Read more here](https://ton.org/grants/)

## 📄 License

RedStone ton connector is an open-source and free software released under the BUSL-1.1 License.
