### Setting up the sway/Fuel environment

1. Install sway & fuel toolchain as
   described [here](https://docs.fuel.network/guides/installation).
    * The version `testnet` of the toolchain should be chosen.
    * The version of the sway language (`forc` compiler) for `testnet` (related to `fuel-core` in version `0.36.0`)
      network must be `0.64.0`.
1. You can use one of the nodes described [here](http://fuelbook.fuel.network/master/networks/networks.html) or
   run a local Fuel node (with or without state persistence), as
   described [here](https://docs.fuel.network/guides/running-a-node/running-a-testnet-node/#running-a-local-node).
    1) in case of using the local network
        1) the default url of the local network is `http://127.0.0.1:4000` (`https` __without__ s ;p)
        1) the transaction needs can be signed via a default signer private key (`--default-signer` should be
           used, [see more here](https://docs.fuel.network/docs/forc/plugins/forc_client/#other-useful-commands-of-forc-wallet))
        1) each transaction costs ETHs, but the origin/default accounts have ETH assets assigned
    1) in case of using the public network
        1) the url of the `testnet` network is `https://testnet.fuel.network/v1/graphql`
        1) each transaction costs ETHs and must be signed by adding the account's private key
            1) the value can be provided by setting the `SIGNING_KEY` variable in the [Makefile](./Makefile) or during
               the invocation of particular methods: `SIGNING_KEY=... make run`
1. The wallet
    1) can be created, for example
        1) by installing the Chrome extension: https://wallet.fuel.network/docs/install/ (Firefox is not supported yet)
        1) by installing the [wallet plugin](https://github.com/FuelLabs/forc-wallet)
           for `forc` (`cargo install forc-wallet`) and then by using `forc-wallet new` command.
    1) once created wallet works for all networks, but the ETH assets needed to be transferred to the particular
       network, __including__ the local network
        1) the faucet for `testnet` network is <https://faucet-testnet.fuel.network/>

### Preparing sample data

The scripts below process the given sample data payload and return the aggregated data in the output logs. To prepare
the data follow the steps:

1. execute `make prepare_data`. The files are saved in
   the [`../../../packages/sdk/scripts/payload-generator/data`](../../../packages/sdk/scripts/payload-generator/data)
   directory
    * the base name of files is defined as `DATA_NAME` variable in
      the [Makefile](../../sdk/scripts/payload-generator/Makefile) in the `/data-generator` directory

### Using the contract

1. run `make deploy`/`SIGNING_KEY=... make deploy` and check the value of "contract id" hex returned by the function
    1. if you have changed the sway-code, which also changes the contract identifier, it's needed to check
       if the `CONTRACT_ID` variable has changed in *configurables* in the following files:
        1. [For contract initializer](contract_initializer/src/main.sw)
        1. [For contract invoker](contract_invoker/src/main.sw)
    1. NOTE:
        1. all time the `make deploy` is invoked for the unchanged code the contract gets the same contract id.
        1. the contract cannot be re-deployed, so it's necessary to change the value of `SALT`
           constant in the [Makefile](./Makefile) to have the contract deployed once-again.
1. There is no contract's constructor in sway, so it's necessary to run `make init`/`make SIGNING_KEY=... init` to have the
   contract initialized.
1. The contract is available for use. You can check it by exploring the
   account [here](https://app.fuel.network)
1. Run `make invoke` to write example values (prepared as [above](#preparing-sample-data)) to the contract and then read
   it.
    1. see how to read the output logs [below](#how-to-read-the-logs)
    1. there are no other possibilities of invoking the contract but scripts, so see/modify the script in
       the [main.sw](contract_invoker/src/main.sw) file.

#### See [here](contract/README.md) how the contract works

### Running the demo sway data-processing script

The sway script executes the whole logic of the data-processing by using the same sway code as the contract uses.
It processes the given payload and returns the aggregated data in the output logs.
Firstly, you need to have the sample data generated as [above](#preparing-sample-data);
then the running script processes it.
The code is executed on one of the networks (`local` or `testnet`), as it's described above.

1. execute `make run` locally or `make SIGNING_KEY=... run` for the testnet network.
    * The values returned by the program are available in [output logs](#how-to-read-the-logs).

#### How to read the logs

The output logs look similar to the following ones, so invoking the commands it's worth to use the `| grep "data"` pipe.

```json
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
