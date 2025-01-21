# Solana - Audit guide

<!-- TOC -->
* [Solana - Audit guide](#solana---audit-guide)
  * [Repository](#repository)
  * [Code description](#code-description)
  * [What should be audited](#what-should-be-audited)
    * [Rust files](#rust-files)
    * [Other files](#other-files)
<!-- TOC -->

## Repository

* The repository: https://github.com/redstone-finance/redstone-oracles-monorepo
* The CommitId: [will be prepared for the particular version]
* Path: [packages/solana-connector/solana/programs](./programs)

The direct path should look like:
[https://github.com/redstone-finance/redstone-oracles-monorepo/tree/[COMMIT_ID]/packages/solana-connector/solana/programs](https://github.com/redstone-finance/redstone-oracles-monorepo/tree/main/packages/solana-connector/solana/programs)

## Code description

* General assumptions [programs/README.md](./programs/README.md)
* PriceAdapter [programs/price-adapter/README.md](./programs/price-adapter/README.md)
* General [RedStone Blockchain Oracles docs](https://docs.redstone.finance/docs/get-started/data-formatting-processing/)
  * Especially [The push model docs](https://docs.redstone.finance/docs/get-started/models/redstone-push/)


## What should be audited

### Rust files

The code-lines inside the following sections in `*/src/**/*.rs` files should be audited.

And the following **should not**:

* imports (use modules)
* tests and dev utility (code under #[cfg(feature = "dev")] and #cfg[(test)]).
* Code comments
* Empty lines
* Code inside test files inside `*/tests/**` directories

### Other files

* We suggest to read `**/README.md`
* We suggest to audit Dependencies inside `**/Cargo.toml` files
