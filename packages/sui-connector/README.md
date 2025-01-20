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
