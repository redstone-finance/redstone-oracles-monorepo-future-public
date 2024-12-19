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

### Sui Package upgrades

After the deployment, we will maintain the `PriceAdapter` object forever. While we can upgrade the package we can't force users of the package to use the new version.
We also would like to be able to change write logic in the future. For example, in case we would find some bugs, or would like to change the protocol.
Given that restrictions, our approach to this problem is to keep both `PriceAdapter` object and `price_adapter` package versioned.
Then we need to ensure:
* reading object `PriceAdapter` always work on every package version
* writes work only on the latest version.
How?
* In the code there are already asserts for all writes that the `PriceAdapter` object version matches the latest one.
* Reads of course do not have similar asserts, and can be freely done.

Manual steps to do:
* Before upgrading the package, bump version constant in the code by 1.
  * located in file `sui/contracts/price_adapter/sources/price_adapter.move`, const named `VERSION`.
* Add function `migrate_to_version_n(_: &AdminCap, price_adapter: &mut PriceAdapter, ...: OtherFields)` to file `sources/migrations.move`
  * where `n` in the function name is equal to new version `VERSION`
  * `OtherFields` are additional external information the migration process may need.
  * during first upgrade we will need to create `sources/migrations.move` file of course.
  * In the function set version of the `price_adapter` to the `VERSION`.
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

### Move code conventions
We try to follow conventions from [here](https://docs.sui.io/concepts/sui-move-concepts/conventions).

Differences:
* We have added a section called `Public Functions` for functions that are public and non-mutable but are not view-only. For example
  * Functions creating structs.
  * Functions filtering collections.

