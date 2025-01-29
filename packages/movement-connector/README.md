# movement-connector

### Deploying and testing

[Install aptos cli](https://aptos.dev/en/build/cli) - Compile the version 3.5.0 of movement CLI.
[Setup localnet](https://aptos.dev/en/build/cli/running-a-local-network)

Run deploy:

```sh
NETWORK=localnet SKIP_FAUCET=true PRIVATE_KEY=... yarn deploy # this will create object_ids.json file used by other scripts. It will be only valid on localnet!
```

Tests:

```sh
NETWORK=localnet yarn test
NETWORK=localnet yarn sample-run
```
