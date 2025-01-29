# sui-connector

## Deploying and testing

1. Install sui-cli - https://docs.sui.io/references/cli/client
2. Setup localnet - https://docs.sui.io/guides/developer/getting-started/local-network

### Deploy

```sh
NETWORK=localnet SKIP_FAUCET=true PRIVATE_KEY=... yarn deploy 
```
This will create `object_ids.[NETWORK].json` file to be used by other scripts.

⚠⚠⚠ **Remember to transfer the AdminCap and UpgradeCap to MultiSig Account!** ⚠⚠⚠

#### Transferring objects

```shell
sui client transfer --object-id <OBJECT_ID> --to <RECIPIENT_ADDRESS> 
```

### Tests

```sh
NETWORK=localnet yarn test
NETWORK=localnet yarn sample-run
```

## Working with ledger

### Checking the ledger public key

1. Connect the ledger
2. Run the Sui application on it or rerun it when the ledger has gone into sleep mode
3. WARN ON THE account ID (Default set to 0, as the first account) inside [ledger-utils.ts](scripts/ledger/ledger-utils.ts)
4. Run
```shell
yarn ledger-utils
```

### Upgrading contract's config

1. Check multi sig address for the selected sig public keys; See `MULTI_SIG_PK_HEXES` in [get-multi-sig-address.ts](scripts/ledger/get-multi-sig-address.ts)
2. Fill the config values in [make-price-adapter-config.ts](scripts/make-price-adapter-config.ts)
3. Run `yarn update-config` and save the returned Base64-encoded result as `TRANSACTION_DATA`
4. Send the `TRANSACTION_DATA` to **EVERY signer** defined in point 1 (for the multi-sig account)
5. For the every **particular signer**, connect the ledger, then run `yarn ledger-utils $TRANSACTION_DATA`
6. Collect all responses, put it into [combine-signatures.ts](scripts/ledger/combine-signatures.ts)
7. Run `yarn combine-signatures` and save `multiSigSignature` the returned value as `MULTISIGSIG`
8. Run
```shell
sui client execute-signed-tx --tx-bytes $TRANSACTION_DATA --signatures $MULTISIGSIG
```

### Upgrading contract's package

1. Copy the version of the contract to be upgraded - name it with suffix `_vN` (for example, `price_adapter_v2`)
2. Define the `DEPLOY_DIR` path inside your [.env](.env) file
3. Perform the contract changes as described [here](./sui/contracts/README.md#sui-package-upgrades).
4. Follow the steps [above](#upgrading-contracts-config)
   1. Instead of points 2. and 3., run `yarn upgrade-package`.
   2. The command will generate a `TRANSACTION_DATA` to sign, which also contains the bytecode of the upgraded source.
5. After invoking the `execute-signed-tx`, save the identifier of newly created package
   to the `object_ids.mainnet.json` file inside the newly copied directory (as in 1.)

#### Start of using the new version

It prevents writing to the object by the old logic, from the OLD relayer.
Following the steps below, **the OLD version relayer will stop working**,
because it requires the version objects compatibility. You will be able to read the written values in ANY version of the package.

1. So **firstly run a NEW relayer** (which will be failing as their package version is different from object's version)
2. Then migrate the object version in the new package to allow the new relayer to work,
   by folowing the steps as described [here](./sui/contracts/README.md#sui-package-upgrades), but
   1. Pass the version number to the `main(N)` function in [migrate-object-version.ts](./scripts/ledger/migrate-object-version.ts)
   2. Instead of points 2. and 3., run `yarn migrate-object-version`.
   3. The command will generate a `TRANSACTION_DATA` to sign
