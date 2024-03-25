### Setting up the cairo/Starknet environment

1. install cairo & start inside a python virtual env: <https://www.cairo-lang.org/docs/quickstart.html>
1. install starknet CLI & set up the account: <https://www.cairo-lang.org/docs/hello_starknet/account_setup.html>
1. transfer Goerli ETH by using <https://faucet.goerli.starknet.io/> as defined in the tutorial
   * wait to have the transfer-transaction accepted on L2 (check it on <https://testnet.starkscan.co/>)
1. fill the value variable `ACC` in the Makefile
   * by putting there a value of the --account if you have passed it to `starknet new_account`
   * the default account name is `__default__`
   * the names of your accounts you can find by executing `cat ~/.starknet_accounts/starknet_open_zeppelin_accounts.json`
1. install protostar inside your virtual env you have started: <https://docs.swmansion.com/protostar/docs/tutorials/installation>
   * export the protostar-PATH to the virtual-env's path: `export PATH="$PATH:/Users/[you]/.protostar/dist/protostar`

### Running the cairo demo program
1. fill the value with `PAYLOAD_URL` in the Makefile (it should have the `format=` at the end). 
   * You might need the `cache-service` started locally and MongoDB installed or set up on the DigitalOcean <https://github.com/redstone-finance/redstone-oracles-monorepo/blob/main/.do/mongodb/README.md>.
1. execute `make prepare_data`. The files are saved in the [`../../sdk/scripts/payload-generator/data`](../../sdk/scripts/payload-generator/data) directory
   * the base name of files is defined as `DATA_NAME` variable in the [Makefile](../../sdk/scripts/payload-generator/Makefile) in the [`../../sdk/scripts/payload-generator`](../../sdk/scripts/payload-generator) directory)
1. execute `make run`

### Using the contract(s)
1. fill the value with `CONTRACT` by putting there `price` or `oracle_values`
1. run `make declare` and save the value of "class hash" hex returned by the function
   * wait to have the transaction accepted on L2 (check it on <https://testnet.starkscan.co/>)
1. run `make CLASS_HASH=0xabc deploy` where `0xabc` is the "class hash" saved in the first step and save the "contract hash".
   * wait to have the transaction accepted on L2
1. run `make prepare_data` once again to have the data's timestamp able to be validated by the contract
1. run `make CONTRACT_ADDRESS=0xdef get_oracle_value(s)` where `0xdef` is the "contract hash" saved in the deploying-step above.
   * for `price` contract there are `set_prices`, `get_eth_price` and `get_btc_price` calls available
   * you can modify the invocation directly in the [Makefile](Makefile)

#### see [here](src/contracts/README.md) how the contracts work

### Verifying the contract(s)
1. Use starkscan verifier as follows: <https://github.com/starkscan/starkscan-verifier>