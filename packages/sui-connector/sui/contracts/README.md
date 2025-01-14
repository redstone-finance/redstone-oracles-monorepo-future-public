# SUI Contracts — general assumptions

<!-- TOC -->
* [SUI Contracts — general assumptions](#sui-contracts--general-assumptions)
  * [PriceAdapter](#priceadapter)
  * [PriceFeed](#pricefeed)
  * [Sui Package upgrades](#sui-package-upgrades)
<!-- TOC -->

## PriceAdapter

* The [PriceAdapter](./price_adapter/README.md) contract is updated from one or more off-chain processes
* The data are written to a shared [`PriceData`](./price_adapter/sources/price_data.move) object
* The contract can be read by one of `view` functions.
* The parameters` update doesn't change the contract code
* Logic update requires changing the code and version ([see migration guide](#sui-package-upgrades))
  * Still, **the shared [`PriceData`](./price_adapter/sources/price_data.move) object ID remains unchanged**
  and is readable by passing **the first PriceAdapter version ID**.

## PriceFeed

* The [PriceFeed](./price_feed/sources/price_feed.move) contract reads the data written
  to a shared [`PriceData`](./price_adapter/sources/price_data.move) object.
* Every feed has its own PriceFeed
* We assume the **PriceFeed contract's ID won't change** and that's the **only recommended** way
  of getting data for the particular feed id.

## Sui Package upgrades

After the deployment, we will maintain the `PriceAdapter` object forever.
While we can upgrade the package, we can't force users of the package to use the new version.
We also would like to be able to change write logic in the future. For example, in case we would find some bugs,
or would like to change the protocol. Given that restriction, our approach to this problem is
to keep both `PriceAdapter` object and `price_adapter` package versioned.
Then we need to ensure:
* reading object `PriceAdapter` always work on every package version
* writes work only on the latest version.
  How?
* In the code there are already asserts for all writes that the `PriceAdapter` object version matches the latest one.
* Reads, of course, do not have similar asserts, and can be freely done.

Manual steps to take:
* Before upgrading the package, bump version constant in the code by 1.
  * located in file `sui/contracts/price_adapter/sources/price_adapter.move`, const named `VERSION`.
* Add function `migrate_to_version_n(_: &AdminCap, price_adapter: &mut PriceAdapter, ...: OtherFields)` to file `sources/migrations.move`
  * where `n` in the function name is equal to new version `VERSION`
  * `OtherFields` are additional external information the migration process may need.
  * during first upgrade we will need to create `sources/migrations.move` file of course.
  * In the function set the version of the `price_adapter` to the `VERSION`.
  * IMPORTANT: remember this function we will be able to call later on. Add guards so we can only call it once and from the version `VERSION - 1`.
* After the upgrade, call the newly created function with the `PriceAdapter` object.
  * Ensure everything is ok.

Example of migrate function:

```rust
/// Migrates to `price_adapter` object version 10
public(package) fun migrate_to_version_10(admin_cap: &AdminCap, price_adapter: &mut PriceAdapter) {
  // check if we should bump the `price_adapter` version.
  assert!(price_adapter.version == 9, E_CANT_BUMP_VERSION);

  // sanity check
  assert!(VERSION == 10, E_VERSION_CONSTANT_INCORRECT);

  // set version to 10
  admin_cap.set_version(price_adapter, VERSION);
}
```
