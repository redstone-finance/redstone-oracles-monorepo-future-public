# SUI - Audit guide

<!-- TOC -->
* [SUI - Audit guide](#sui---audit-guide)
  * [Repository](#repository)
  * [Code description](#code-description)
    * [Move code conventions](#move-code-conventions)
  * [What should be audited](#what-should-be-audited)
    * [Move files](#move-files)
    * [Other files](#other-files)
<!-- TOC -->

## Repository

* The repository: https://github.com/redstone-finance/redstone-oracles-monorepo
* The CommitId: [will be prepared for the particular version]
* Path: [packages/sui-connector/sui-contracts](./contracts)

The direct path should look like:
[https://github.com/redstone-finance/redstone-oracles-monorepo/tree/[COMMIT_ID]/packages/sui-connector/sui/contracts](https://github.com/redstone-finance/redstone-oracles-monorepo/tree/main/packages/sui-connector/sui/contracts)

## Code description

* General assumptions [contracts/README.md](./contracts/README.md)
* PriceAdapter [contracts/price_adapter/README.md](./contracts/price_adapter/README.md)
* PriceFeed [contracts/price_feed/sources/price_feed.move](./contracts/price_feed/sources/price_feed.move)
* General [RedStone Blockchain Oracles docs](https://docs.redstone.finance/docs/get-started/data-formatting-processing/)
  * Especially [The push model docs](https://docs.redstone.finance/docs/get-started/models/redstone-push/):

### Move code conventions
We try to follow conventions from [here](https://docs.sui.io/concepts/sui-move-concepts/conventions).

Differences:
* There's added a section called `Public Functions` for functions that are public and non-mutable but are not view-only.
  For example
  * Functions creating structs.
  * Functions filtering collections.

## What should be audited

### Move files

The code-lines inside the following sections in `*/sources/**/*.move` files should be audited,
according to the [Section naming guide](https://docs.sui.io/concepts/sui-move-concepts/conventions#add-section-titles)

* Definitions
  * `// === Structs ===`
  * `// === Errors ===`
  * `// === Constants ===`
* Interface Functions
  * `// === Public-Package Functions ===`
  * `// === Public-Mutative Functions ===`
  * `// === Public-View Functions ===`
* Other/Helper functions
  * `// === Admin Functions ===`
  * `// === Public Functions ===`
  * `// === Private Functions ===`
  * `// === Method Aliases ===`

And the following **should not**:

* `// === Imports ===`
* `// === Test Functions ===`
* Code comments
* Empty lines
* Code inside test files inside `*/tests/**` directories

### Other files

* We suggest to read `**/README.md`
* We suggest to audit Dependencies inside `**/Move.toml` files
