# RedStone Rust environment

<!-- TOC -->

- [RedStone Rust environment](#redstone-rust-environment)
  - [Setting up the Rust/Casper environment](#setting-up-the-rustcasper-environment)
  - [Preparing sample data](#preparing-sample-data)
  - [Using the contract](#using-the-contract)
    - [Upgrading the contract](#upgrading-the-contract)
    - [See here how the contracts work.](#see-here-how-the-contracts-work)
  - [Running the demo Rust data-processing script](#running-the-demo-rust-data-processing-script)
  - [Running tests](#running-tests)
  - [Upgrading docs](#upgrading-docs)

<!-- TOC -->

### Setting up the Rust/Casper environment

1. Install rust & Casper toolchain as described [here](https://docs.casper.network/resources/quick-start/).
   - The exact version `1.68.2`/`nightly-2023-03-25` of the rust language is required
1. The wallet
   1. can be created, for example
      1. by installing the browser extension: https://www.casperwallet.io/user-guide/getting-started
      1. by creating a key locally and then importing to the casper
         network: https://docs.casper.network/developers/prerequisites/#setting-up-an-account, where can be found
         1. the way
            of [generating key by CLI](https://docs.casper.network/concepts/accounts-and-keys/#option-1-generating-keys-using-the-casper-client-option-1-key-generation-using-the-casper-client)
         2. as well as
            a [video-tutorial](https://www.youtube.com/watch?v=sA1HTPjV_bc&list=PL8oWxbJ-csEqi5FP87EJZViE2aLz6X1Mj)
            going through the whole process.
   1. the account doesn't need to be deployed to the network - it works directly by their public key on all networks
   1. the `CSPR` assets needed to be transferred to the particular network
      1. for the testnet you can use https://testnet.cspr.live/tools/faucet, but the faucet can be used only ONCE for
         the account.

### Preparing sample data

The scripts below process the given sample data payload and return the aggregated data in the output logs. To prepare
the data, execute `make prepare_data` in the `rust` directory.

1. A payload generator from [`../../sdk/scripts/payload-generator/`](../../sdk/scripts/payload-generator/index.ts) is
   used under the hood
1. The files are saved into the [`scripts/sample-data`](scripts/sample-data) directory

### Using the contract

1. Initial parameters should be given to the [`input.mk`](input.mk) file
   1. Define `CONTRACT=$(PRICE_FEED)` or `CONTRACT=$(PRICE_ADAPTER)` or `CONTRACT=$(PRICE_RELAY_ADAPTER)` at the top.
   1. When you need to change the default initial parameters or in case of troubles, modify the parameters below that
      line.
   1. Define the `SECRET_KEY` as the path you created the keys in the previous paragraph.
1. The contract can be deployed and initialized by using `make deploy-and-init` command.
   1. The deployed package hash can be found in one of `DEPLOYED.hex` files in the particular contract dirs.
1. The predefined methods are prepared for using the contracts:
   1. `make write_prices` writes the [prepared sample data](#preparing-sample-data) to the contract when the CONTRACT
      is `PRICE_ADAPTER` or `PRICE_RELAY_ADAPTER`.
   1. `make read_eth_price` can be used for querying the adapter about the ETH price.
   1. `make get_eth_price_and_timestamp` can be used for getting the ETH value and timestamp from the `PRICE_FEED`
      contract - and then querying the data.
   1. `make process_chunks` is defined for writing the payload in chunks into `PRICE_RELAY_ADAPTER`

Note: `make script-COMMAND` runs `make COMMAND` and then waits for the deployment results.

#### Upgrading the contract

1. You can run `make script-upgrade` to upgrade the contract-package with a newer contract version.
   1. The whole system is transparent regarding the contract's version—it uses contract-package hashes with their
      newest implementations.
   1. Only the contract creator can upgrade the contract. In other cases the `Forged reference` error will be thrown.
   ```json
   { "error_message": "Forged reference: URef(..., READ_ADD_WRITE)" }
   ```

Note: **_Remember to properly set the `CONTRACT=...` value before the execution_**

#### See [here](contracts/README.md) how the contracts work

### Running the demo Rust data-processing script

1. Define the `CONTRACT` value as above.
1. Execute `make run` locally.
1. The rust script executes the whole logic of the data-processing by using the same code as the contract uses.
1. It processes the given payload and returns the aggregated data in the output logs.
1. Firstly, you need to have the sample data generated as [above](#preparing-sample-data)
1. Then the running script processes it—the code is executed on the local network, by using `casper-execution-engine`

### Running tests

1. run `make test`

### Upgrading docs

1. run `make docs` and find it in the [`target`](./target) directory.
