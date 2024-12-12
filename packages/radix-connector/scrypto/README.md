# RedStone Scrypto environment

<!-- TOC -->

- [RedStone Scrypto environment](#redstone-scrypto-environment)
  - [Scrypto](#scrypto)
  - [Local - Radix Engine Simulator](#local---radix-engine-simulator)
    - [Preparing sample data](#preparing-sample-data)
    - [Using the PriceAdapter contract](#using-the-priceadapter-contract)
      - [See here how the contract works](#see-here-how-the-contract-works)
    - [Running tests](#running-tests)
    - [Preparing docs](#preparing-docs)
  - [Testnet & mainnet](#testnet--mainnet)
    - [Wallet](#wallet)
    - [Using the PriceAdapter contract](#using-the-priceadapter-contract-1)
      - [See here how the contract works](#see-here-how-the-contract-works-1)

<!-- TOC -->

## Scrypto

1. Install Rust & Scrypto toolchain as described [here](https://docs.radixdlt.com/v1/docs/getting-rust-scrypto).
1. Install `resim` - an entry point command to interact with the Radix Engine Simulator for local development purposes

```shell
cargo install --force radix-clis
```

## Local - Radix Engine Simulator

### Preparing sample data

The scripts below process the given sample data payload and return the aggregated data in the output logs. To prepare
the data, execute `make update_data` in the `scrypto` directory.

1. A payload generator from [`../../sdk/scripts/payload-generator/`](../../sdk/scripts/payload-generator/index.ts) is
   used under the hood
1. The files are saved into the [`sample-data`](sample-data) directory
1. The function also updates the current time in the `resim` environment

### Using the PriceAdapter contract

1. The contract can be deployed and initialized by using `make deploy_adapter` command.
    1. The deployed [`package.resim.addr`](price_adapter/package.resim.addr)
       and [`component.resim.addr`](price_adapter/package.resim.addr) hashes can be found in the
       [`price_adapter`](price_adapter)
       directory.
1. The predefined methods are prepared for using the contracts:
    1. `make write_prices` writes the [prepared sample data](#preparing-sample-data) to the contract (RedStone push
       model).
    1. `make read_prices` can be used for querying the adapter about the previously saved prices.
    1. `make get_prices` can be used for processing values of [prepared sample data](#preparing-sample-data) in RedStone
       Pull model.

The values returned by the scripts are visible under the Outputs

#### See [here](price_adapter/README.md) how the contract works

### Running tests

Run

```shell
make test
```

### Preparing docs

Run

```shell
make docs
```

and then find it in the [`target`](./target) directory.

## Testnet & mainnet

### Wallet

1. Please visit https://wallet.radixdlt.com for a step-by-step guide on how to get up and running with the Radix Wallet.

### Using the PriceAdapter contract

1. For deploying a package or instantiating components to a testnet,
    1. use https://stokenet-console.radixdlt.com/ for Stokenet
       (or https://console.radixdlt.com/ for mainnet).
    2. You can also install a desktop tool: https://github.com/atlantis-l/Radix-Desktop-Tool/releases or
    3. use prepared scripts from [test/scipts](../test/scripts) directory:

```shell
yarn sample-deploy
```

or

```shell
yarn sample-instantiate
```

filling the `PRIVATE_KEY` variable in `.env` and/or

1. Perform sample run

```shell
yarn sample-run
```

#### See [here](price_adapter/README.md) how the contract works
