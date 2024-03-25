### Setting up the sway/Fuel environment

1. Install sway & fuel toolchain as described [here](https://fuellabs.github.io/sway/master/book/introduction/installation.html).
   * The version `beta-3` of the toolchain should be chosen.
   * The version of the sway language (`forc` compiler) for `beta-3` (related to `fuel-core` in version `0.17.x`)
     network must be `0.35.x`.
1. In case of troubles 
   1) of the `fuelup` installation
      1) the installation of the newest version of `fuelup` is also described [here](http://install.fuel.network/master/installation/index.html)
   1) of the `sway` library installation/usage
      1) it can be downloaded as a source from [here](https://github.com/FuelLabs/sway) and the proper version-tag checked out
      1) then `cargo build` should be run (it's needed to have `cargo` installed)
      1) and the path exported by using for example: `export PATH="$HOME/Devel/sway/target/debug:$PATH"`
   1) of the `fuel-core` installation/usage 
      1) it can be downloaded as a source from [here](https://github.com/FuelLabs/fuel-core) and the proper version-tag checked out
      1) then `cargo xtask build` should be run (it's needed to have `cargo` installed)
      1) and the path exported by using for example: `export PATH="$HOME/Devel/fuel-core/target/debug:$PATH"`
1. You can use one of the nodes described [here](http://fuelbook.fuel.network/master/networks/networks.html) or 
run a local Fuel node (with or without state persistence), as described [here](http://fuelbook.fuel.network/master/for-developers/running-a-local-node.html).
   1) in case of using the local network
      1) the default url of the local network is `http://127.0.0.1:4000` (`https` __without__ s ;p)
      1) no transaction needs to be signed (`--unsigned` should be used)
      1) each transaction costs ETHs but the origin/default accounts have ETH assets assigned
      1) the list of origin accounts is displayed as one of first logs in the running network, for example:
         ```(2023-03-15T12:52:14.257382Z  INFO fuel_core_chain_config::config::chain: 96: Initial Accounts```
         ```2023-03-15T12:52:14.262308Z  INFO fuel_core_chain_config::config::chain: 105: PrivateKey(0xabc), Address(0xdef [bech32: fuel01fc]), Balance(10000000)```
   1) in case of using the public network
      1) the url of the `beta-3` network is `https://beta-3.fuel.network/graphql`
      1) each transaction costs ETHs and must be signed by adding the account's private key
         1) the value can be provided by setting the `SIGNING_KEY` variable in the [Makefile](../Makefile) or during the
            invocation of particular methods: `make SIGNING_KEY=... run`
1. The wallet
   1) can be created for example
      1) by installing the chrome extension: https://wallet.fuel.network/docs/install/ (Firefox is not supported yet)
      1) by installing the [wallet plugin](https://github.com/FuelLabs/forc-wallet)
         for `forc` (`cargo install forc-wallet`) and then by using `forc-wallet new` command.
   1) once created wallet works for all networks, but the ETH assets needed to be transferred to the particular network,
      __including__ the local network
      1) the faucet for `beta-3` network is <https://faucet-beta-3.fuel.network/>
      1) for the local network you can transfer the ETH assets from one of the origin accounts by
         running  [transfer.spec.ts](../test/prices/transfer.spec.ts), passing there one of the account
         private-keys listed above.

### Preparing sample data

The scripts below process the given sample data payload and return the aggregated data in the output logs. To prepare
the data follow the steps:

1. execute `make prepare_data`. The files are saved in the `../../data-generator/data` directory
   * the base name of files is defined as `DATA_NAME` variable in
     the [Makefile](../../sdk/scripts/payload-generator/Makefile) in the `/data-generator` directory

### Using the contract

1. run `make deploy`/`make SIGNING_KEY=... deploy` and save the value of "contract id" hex returned by the function
   1. if you have changed the sway-code, which also changes the contract identifier, it's needed to fill
      the `CONTRACT_ID` variable in the [Makefile](../Makefile) and in the following configuration files:
      1. [For contract initializer](contract_initializer/Forc.toml)
      1. [For contract invoker](contract_invoker/Forc.toml)
   1. NOTE:
      1. all time the `make deploy` is invoked for the unchanged code the contract gets the same contract id.
      1. the contract cannot be re-deployed, so it's needed to change the value of `SALT`
         constant [here](contract/Forc.toml) to have the contract deployed once-again.
1. There is no contract's constructor in sway, so it's needed to run `make init`/`make SIGNING_KEY=... init` to have the
   contract initialized.
1. The contract is available for use. You can check it by exploring the
   account [here](https://fuellabs.github.io/block-explorer-v2/beta-3/)
1. Run `make invoke` to write example values (prepared as [above](#preparing-sample-data)) to the contract and then read
   it.
   1. see how to read the output logs [below](#how-to-read-the-logs)
   1. there are no other possibilities of invoking the contract but scripts, so see/modify the script in
      the [main.sw](contract_invoker/src/main.sw) file.

#### See [here](contract/README.md) how the contract works

### Running the demo sway data-processing script

The sway script executes the whole logic of the data-processing by using the same sway code as the contract uses. It
processes the given payload and returns the aggregated data in the output logs.
Firstly you need to have the sample data generated as [above](#preparing-sample-data), then the running script processes
it.
The code is executed on one of networks (local or testnet), as it's described above.

1. execute `make run` locally or `make SIGNING_KEY=... run` for the testnet network.
   * The values returned by the program are available in [output logs](#how-to-read-the-logs).

#### How to read the logs

The output logs look similar to the following ones, so invoking the commands it's worth to use the `| grep "data"` pipe.

```
[
  {
    "LogData": {
      "data": "00000000000000000000000000000000000000000000000000000000593beee0",
...
    }
  },
  {
    "LogData": {
      "data": "00000000000000000000000000000000000000000000000000000275d9ec9918",
...
    }
  },
  {
    "LogData": {
      "data": "00000000000000000000000000000000000000000000000000000029c8a20548",
...
    }
  },
...
  {
    "ScriptResult": {
      "gas_used": 131851,
      "result": "Success"
    }
  }
]
```

The demo script and the contract invoker process data for AVAX, BTC and ETH feeds, so the last 3 hex numbers in
the `data` field are the
aggregated price values of these feeds. For example,
`00000000000000000000000000000000000000000000000000000275d9ec9918`(hex) - as the second log's value -
means `2705190590744` in decimal, which is the BTC's aggregated price value in USD with 8 decimal digit precision
(multiplied by `10 ** 8`). The output values depend on the input data.

### Running tests

1. run `make test`
