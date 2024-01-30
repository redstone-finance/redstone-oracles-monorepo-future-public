# 🔗 @redstone-finance/evm-connector

[![License](https://img.shields.io/badge/license-MIT-green)](https://choosealicense.com/licenses/mit/)
[![Discord](https://img.shields.io/discord/786251205008949258?logo=discord)](https://discord.gg/2CT6hN6C)
[![NPM](https://img.shields.io/npm/v/@redstone-finance/evm-connector)](https://www.npmjs.com/package/@redstone-finance/evm-connector)
[![Twitter](https://img.shields.io/twitter/follow/redstone_defi?style=flat&logo=twitter)](https://twitter.com/intent/follow?screen_name=redstone_defi)

The @redstone-finance/evm-connector module implements an alternative design of providing oracle data to smart contracts. Instead of constantly persisting data on EVM storage (by data providers), the information is brought on-chain only when needed (by end users). Until that moment data remains in the decentralized cache layer, which is powered by RedStone light cache gateways and streamr data broadcasting protocol. Data is transferred to the EVM by end users, who should attach signed data packages to their transaction calldata. The information integrity is verified on-chain through signature checking.

## Getting started

Please refer to [documentation](https://docs.redstone.finance/docs/smart-contract-devs/get-started/redstone-core)

## 👨‍💻 Development and contributions

The codebase consists of a wrapper written in typescript which is responsible for packing the data and solidity smart contracts that extract the information. We encourage anyone to build and test the code and we welcome any issues with suggestions and pull requests.

### Installing the dependencies

```bash
yarn install
```

### Compiling and running the tests

```bash
yarn test
```

## 📄 License

RedStone EVM connector is an open-source and free software released under the BUSL-1.1 License.
