# *RedStone Oracles* Casper connector

## Stage 1 - in-depth analysis from the point of view of *RedStone Oracles* protocol

<!-- TOC -->
- [*RedStone Oracles* Casper connector](#redstone-oracles-casper-connector)
  - [Stage 1 - in-depth analysis from the point of view of *RedStone Oracles* protocol](#stage-1---in-depth-analysis-from-the-point-of-view-of-redstone-oracles-protocol)
    - [Available data types and language features](#available-data-types-and-language-features)
    - [Available cryptographic functions](#available-cryptographic-functions)
    - [The gas cost structure](#the-gas-cost-structure)
      - [The mainnet chainspec extract[^1]](#the-mainnet-chainspec-extract1)
      - [Gas cost comparison](#gas-cost-comparison)
    - [The best way of attaching *RedStone Oracles* payload](#the-best-way-of-attaching-redstone-oracles-payload)
    - [Available timestamp details in the context of transaction](#available-timestamp-details-in-the-context-of-transaction)
<!-- TOC -->

### Available data types and language features

Casper smart contracts can be implemented in any programming language that compiles to WebAssembly (Wasm),
and they can be installed and executed on the chain using Deploys, which are akin to transactions. However,
most of the documentation examples and the Casper system contracts are written in Rust[^1].
Therefore, Rust will be the primary language used for developing RedStone Oracles smart contracts.

Built-in Rust types are tightly integrated into the language in ways that are nontrivial and cannot be emulated with
user-defined types.

The list of types is:

* Primitive types (Boolean, integer and float, Textual)
* Sequence types (Tuple, Array, Slice)
* User-defined types (Struct, Enum, Union)
* Function types (Functions, Closures)
* Pointer types (References, Raw pointers, Function pointers)
* Trait types (Traits and Impls)

There are also two important crates that are dependencies for developing libraries/smart-contracts for the Casper
network:

* `casper-types` - types shared by many casper crates for use on the Casper network.
* `casper-contracts` - a library for developing Casper network smart contracts.

The `casper-types` crate provides also implementations of the `U256` and `U128` types, which are composed of 4 and
2 `u64` parts, respectively. These implementations ensure overflow-free computations on RedStone Oracles objects and
allow for constructing these types using a list of bytes (`u8`).

A good practice is also not to enable the `std` feature when linking to the `casper-contract` or `casper-types` crates,
using the `#![no_std]` attribute, which tells the program not to import the standard libraries.
The WASM needs to be optimized by using a set of settings or external tools like `wasm-strip` due to the max deploy
size, which is defined as 1MB

### Available cryptographic functions

Given the widespread use of Rust, it's also possible to utilize most of the available Rust cryptographic functions.

For calculating keccak256 hashes, the `sha3` crate is used, which is a pure Rust implementation of SHA-3, a family of
Keccak-based hash functions.

The following crates have been checked and tested for recovering keys based on the secp256k1 algorithm:

* `secp256k1` - a wrapper around `libsecp256k1`, a C-language library, implementing various cryptographic functions
  using the SECG curve secp256k1.
* `k256` - a secp256k1 elliptic curve library written in pure Rust with support for ECDSA
  signing/verification/public-key recovery.

However, although `k256` is used as a dependency for the `casper-types` crate, its runtime cost is higher than that
of `secp256k1`.

### The gas cost structure

Computations occurring on-chain come with associated gas costs.
The amount of gas required for a transaction is determined by how much code is executed on the blockchain.
Currently, gas is priced at a fixed price of 1 mote (1 CSPR is 10^9 motes) per 1 unit of gas.
The gas charged for a transaction on the blockchain is paid to the network's validators[^1].

The current price of **1 CSPR**, as of May 2022 to January 2024, is estimated to be about **$0.05**.

#### The mainnet chainspec extract[^1]


| Operations       | cost<br/>(in motes) | comment / examples                                      |
| :--------------- | :-----------------: | ------------------------------------------------------- |
| Wasm             |      200 - 400      | bit, add, mul, div, const, conversion                   |
| Control flow     |         440         | block, loop, if, elese, end, return, drop               |
| Branch           |       35,000       | loop until, loop if, br_table (per label)               |
| Contract         |   4,500 - 23,000   | new_uref, call_contract, add/remove associated key, ret |
| Environment      |      200 - 760      | get_blocktime, get_named_arg, get_caller, is_valid_uref |
| Grow memory cost |       240,000       | per page (64 kB)                                        |

There is also gas fee charged per byte stored in global state: 630,000 motes **per byte equating** to **0.65 CSPR (~
$0.03)**

#### Gas cost comparison


| Operations                               | using`secp256k1` lib | using`k256` lib    |
| ---------------------------------------- | -------------------- | ------------------ |
| Price adapter contract deployment + init | 236 CSPR =~ $11.8    | 155 CSPR =~ $7.75  |
| Updating contract: 1 feed x 1 signer     | 7.7 CSPR =~ $0.39    | 15.3 CSPR =~ $0.77 |
| Updating contract: 1 feed x 5 signers    | 38.3 CSPR =~ $1.92   | 75.3 CSPR =~ $3.77 |
| Updating contract: 2 feeds x 3 signers   | 46.2 CSPR =~ $2.31   | 90.5 CSPR =~ $4.53 |

As the numbers indicate, the most heavy operation is the recovery of secp256k1 curve keys, given their signature and
data. The total cost is nearly linear and depends on the number of packages included in the *RedStone Oracles* payload,
amounting to approximately **7.5 CSPR (~$0.4) per package**, when using `secp256k1` library, which is the cheaper one.

### The best way of attaching *RedStone Oracles* payload

The *RedStone Oracles* payload is defined as a list of bytes, and it can be transferred to the chain as is.
However, there are some limitations regarding data length when using the CLI or the `casper-js-sdk` TypeScript library.
The total length of serialized session code runtime arguments is limited to 1024 bytes.
In practice, since other parameters also need to be passed, this means that the maximum number of data packages
in one Deploy is limited to 6. Each data package consists of 144 bytes for a single data point package[^2].

This limitation can be managed, for example, by sending data feed by feed and then committing the whole computation as
atomic. Additional methods for contracts can be implemented to handle this.

### Available timestamp details in the context of transaction

There exists a `casper_contract::contract_api::runtime::get_blocktime` function.

This function gets the timestamp which will be in the block this deploy is included in. The return value is always a
64-bit unsigned integer, representing the number of milliseconds since the Unix epoch[^1].

[^1]: [Taken from Casper docs](https://docs.casper.network/)

[^2]: [RedStone docs](https://docs.redstone.finance/img/payload.png)
