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


### Move code conventions
We try to follow conventions from [here](https://docs.sui.io/concepts/sui-move-concepts/conventions).

Differences:
* We have added a section called `Public Functions` for functions that are public and non-mutable but are not view-only. For example
  * Functions creating structs.
  * Functions filtering collections.
