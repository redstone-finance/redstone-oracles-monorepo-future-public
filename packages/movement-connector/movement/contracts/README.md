# Movement Contracts — general assumptions

<!-- TOC -->
* [Movement Contracts — general assumptions](#movement-contracts--general-assumptions)
  * [PriceAdapter](#priceadapter)
  * [PriceFeed](#pricefeed)
  * [Movement Package upgrades](#package-upgrades)
<!-- TOC -->

## PriceAdapter

* The [PriceAdapter](./price_adapter/README.md) contract is updated from one or more off-chain processes
* The data are written to a shared [`PriceData`](./price_adapter/sources/price_data.move) object
* The contract can be read by one of `view` functions.
* The parameters` update doesn't change the contract code
* Logic update requires changing the code and version ([see migration guide](#package-upgrades)
  * Still, **the shared [`PriceData`](./price_adapter/sources/price_data.move) object ID remains unchanged**
  and is readable by *passing the first PriceAdapter version ID*.

## PriceFeed

* The [PriceFeed](./price_feed/sources/price_feed.move) contract reads the data written
  to a shared [`PriceData`](./price_adapter/sources/price_data.move) object.
* Every feed has its own PriceFeed
* We assume the **PriceFeed contract's ID won't change** and that's the **only recommended** way
  of getting data for the particular feed id.

## Package upgrades

After the deployment, we will maintain the `PriceAdapter` object forever.
The package upgrade enusres that the package user will always get the newest published version on the chain.
Details are in movement documentation [here](https://aptos.dev/en/build/smart-contracts/book/package-upgrades).
