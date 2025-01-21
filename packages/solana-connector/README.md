# solana-connector

## Deploying and testing

### Requirements
Before use you will need:
* rust
* solana-cli
* anchor-cli
* node

### Tools versions
* anchor-cli 0.30.1
* solana-cli 2.1.4 (src:024d047e; feat:288566304, client:Agave)
* npm 10.9.0
* node v18.20.5

All instalation steps are described [here](https://solana.com/docs/intro/installation#install-dependencies)

### Build and run contract tests

```sh
cd solana
make build
make lint
make test
```

### Run deploy

Fill envs in file .env. See .env.example for reference.

```sh
NETWORK=localnet yarn sample-deploy
NETWORK=localnet yarn sample-run
```
