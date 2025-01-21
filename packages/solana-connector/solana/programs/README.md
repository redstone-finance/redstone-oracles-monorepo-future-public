# Solana Contracts — general assumptions

<!-- TOC -->
* [Solana Contracts — general assumptions](#solana-contracts--general-assumptions)
  * [PriceAdapter](#priceadapter)
<!-- TOC -->

## PriceAdapter

* The [PriceAdapter](./price_adapter/README.md) contract is updated from one or more off-chain processes.
* The data are written to a [`PriceData`](./price-adapter/src/state.rs) account created per Feed id.
* The contract can be read by one of `view` functions.
* The parameters` update doesn't change the contract code
* Logic update requires changing the code.
  * Still, **the account [`PriceData`](./price-adapter/src/state.rs) ID remains unchanged**
  and is readable.
