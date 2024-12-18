# sui-connector

### Deploying and testing

Install sui-cli - https://docs.sui.io/references/cli/client
Setup localnet - https://docs.sui.io/guides/developer/getting-started/local-network

Run deploy:

```sh
NETWORK=localnet SKIP_FAUCET=true PRIVATE_KEY=... yarn deploy # this will create object_ids.json file used by other scripts. It will be only valid on localnet!
```

Tests:

```sh
NETWORK=localnet yarn test
NETWORK=localnet yarn sample-run
```
