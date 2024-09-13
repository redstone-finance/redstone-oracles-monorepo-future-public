# On-chain relayer

[![License](https://img.shields.io/badge/license-MIT-green)](https://choosealicense.com/licenses/mit/)
[![Discord](https://img.shields.io/discord/786251205008949258?logo=discord)](https://discord.gg/2CT6hN6C)
[![Twitter](https://img.shields.io/twitter/follow/redstone_defi?style=flat&logo=twitter)](https://twitter.com/intent/follow?screen_name=redstone_defi)

## Documentation

The complete documentation can be found [here](https://docs.redstone.finance/docs/smart-contract-devs/get-started/redstone-classic)


## Run on-chain relayer

1. Install dependencies - `yarn`
2. Compile contracts - `yarn compile`
3. Deploy contracts - [script](../contract-deployments/scripts/deploy-price-feed-contract.ts) by using `yarn run-script`
4. Put correct data to [environment variables](https://docs.redstone.finance/docs/smart-contract-devs/get-started/redstone-classic#environment-variables)
5. Compile code - `yarn build`
6. Start on-chain relayer - `yarn start`
