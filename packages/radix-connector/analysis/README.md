# *RedStone Oracles* Radix connector

## Stage 1 - in-depth analysis from the point of view of *RedStone Oracles* protocol

<!-- TOC -->

* [*RedStone Oracles* Radix connector](#redstone-oracles-radix-connector)
  * [Stage 1 - in-depth analysis from the point of view of *RedStone
      Oracles* protocol](#stage-1---in-depth-analysis-from-the-point-of-view-of-redstone-oracles-protocol)
    * [Available data types and language features](#available-data-types-and-language-features)
    * [Available cryptographic functions](#available-cryptographic-functions)
    * [The gas cost structure](#the-gas-cost-structure)
      * [The specification extract](#the-specification-extract)
    * [The best way of attaching *RedStone Oracles* payload](#the-best-way-of-attaching-redstone-oracles-payload)
    * [Available timestamp details in the context of transaction](#available-timestamp-details-in-the-context-of-transaction)

<!-- TOC -->

### Available data types and language features

On Radix, the concept of smart contacts is split into two: blueprints and components.
A blueprint is how a Radix smart contract starts life. It is an on-ledger template of smart contract functionality
that can be instantiated into “components.” Blueprints are deployed to the Radix Network in what are called Packages,
which may contain multiple Blueprints.

The programming language used to create smart contract blueprints and components on Radix is Scrypto.
Based on Rust, Scrypto substantially improves the Web3 and DeFi developer experience by providing assets (tokens)
as a native first-class feature of the language. The code created in Scrypto compiles to WebAssembly (Wasm).

The list of types in Scrypto includes:

* Primitive types (integer `i8`-`i128`, unsigned integer `u8`-`u128`, `String`)
* Safe types, guaranteed to panic, when they overflow as opposed to primitive types (`I8-I512`, `U8-U512`, `Decimal`)
* Container Types (array, `Option`, `Tuple`, `Vec`, `BTreeSet`/`BTreeMap`, `HashSet`/`HashMap`)
* Rust Struct and Enums, as long as the fields are of the supported types
* Scrypto Types (domain-specific types to enable asset-oriented programming)

There are two important Rust crates that are dependencies for developing blueprints/components for the Radix stack:

* `scrypto` - the foundation of Scrypto blueprints, a set of minimal and shared abstractions on top of Radix Engine.
  It enables asset-oriented programming for feature-rich DeFi dApps.
* `radix-common` - a library of common types and functions shared by all layers of the Radix stack.

The `radix-common` crate provides also implementation of the `U256` type, which is composed of 4 `u64` parts.
These implementations ensure overflow-free computations on *RedStone Oracles* objects and
allow for constructing these types using a list of bytes (`u8`).
<br />
<br />

### Available cryptographic functions

Given the widespread use of Rust, it's also possible to utilize most of the available Rust cryptographic functions.

For calculating Keccak256 hashes, the `sha3` crate is used, which is a pure Rust implementation of SHA-3, a family of
Keccak-based hash functions.

The following crates have been checked and tested for recovering keys based on the secp256k1 algorithm:

* `secp256k1` - a wrapper around `libsecp256k1`, a C-language library, implementing various cryptographic functions
  using the SECG curve secp256k1 — being also a dependency of the `radix-common` crate
* `k256` - a secp256k1 elliptic curve library written in pure Rust with support for ECDSA
  signing/verification/public-key recovery — which runtime cost is higher than that of `secp256k1`

### The gas cost structure

Costing is the process of billing for the computation and storage that a transaction consumes.
This is to encourage fair use of the network capacity while disincentivizing transaction spamming.
As of now, XRD (1 XRD = 0.06 USD) is the only currency used for costing.

At the very high-level, transaction costs can be broken down into the following categories:

* Execution — for the CPU usage during the execution of a transaction
* Finalisation — for the CPU usage during the finalisation of a transaction
* Storage — for the additional data being added to a Node database
  * State Storage — The substates
  * Archive Storage — Transaction payload, events and logs
* Royalties — amount of XRD paid to blueprint developers and component owners for the use of the code or component
  instances
* Tip — extra amount of XRD paid to validators for the processing of a transaction

#### The specification extract

| Operations             |                     Cost                     | comment / examples                                                                                                                                |
|:-----------------------|:--------------------------------------------:|---------------------------------------------------------------------------------------------------------------------------------------------------|
| Execution/Finalisation | 0.00000005 XRD per execution cost unit (ECU) |                                                                                                                                                   |
| State/Archive Storage  |              100 XRD per 1 MiB               |                                                                                                                                                   |
| Run native code        |      34 native execution units = 1 ECU       | [Native function base costs reference](https://github.com/radixdlt/radixdlt-scrypto/blob/main/radix-engine/assets/native_function_base_costs.csv) |
| Run WASM code          |      3000 WASM execution units = 1 ECU       | [WASM weights reference](https://github.com/radixdlt/radixdlt-scrypto/blob/main/radix-engine/src/vm/wasm/weights.rs)                              |
| Read from database     |           40,000 + size / 10  ECU            | (160,000 ECU when not found)                                                                                                                      |

The current protocol defined parameters can be found here: https://docs.radixdlt.com/docs/transaction-costing
<br />
<br />

### The best way of attaching *RedStone Oracles* payload

In Radix, SBOR (originally standing for “Scrypto Binary-Friendly Object Representation”) is the serialization format
used for communication between actors in the engine and for storing state.
SBOR is specifically designed for the Radix network, offering a powerful and efficient way to encode and decode complex
data structures while ensuring that data remains compact, secure, and verifiable.

SBOR is heavily utilized in Scrypto, Radix’s smart contract language. Whenever a Scrypto smart contract interacts
with the Radix ledger or other smart contracts, the data is serialized into SBOR format.
Likewise, when data is retrieved from the ledger, it is deserialized using SBOR.

The SBOR Manifest supports a variety of fundamental data types, including:

* Booleans and signed/unsigned integers up to 128 bits in length,
* UTF8-8 encoded strings,
* Enums and tuples derived from known types,
* Arrays and maps.

In the context of *RedStone Oracles*, the payload is defined as a list of bytes, which can be transferred directly
to the ledger. This is because arrays, vectors, and U8 values have their corresponding SBOR encoders implemented.

However, `U256` values do not have a direct SBOR encoder and must instead be transferred in a digit-based format,
which consists of four `u64` values.

### Available timestamp details in the context of transaction

In Radix, while the concept of epochs provides a way to track the progression of time, there is no native function
to retrieve a precise timestamp. However, this limitation can be mitigated by creating a blueprint whose instance
(component) is regularly updated by trusted updaters. This component can also leverage the epoch information
to approximate the current time, providing a reliable source of time-related data with the necessary granularity,
despite the absence of direct timestamp access.

Another way to approximate the current time in the Radix network is by utilizing the Proposer timestamp provided
by the Consensus Manager. This timestamp represents the time at which the current proposal is being made,
rather than the time that has been committed to the ledger. It allows you to obtain a more precise time reference,
with the requested precision, directly from the network’s consensus process. This can serve as an additional method
for obtaining a reliable time approximation, complementing the epoch-based approach.

```rust
pub fn get_current_time(&self) -> i64 {
    let rtn = ScryptoVmV1Api::object_call(
        CONSENSUS_MANAGER.as_node_id(),
        CONSENSUS_MANAGER_GET_CURRENT_TIME_IDENT,
        scrypto_encode(&ConsensusManagerGetCurrentTimeInputV1 {
            precision: TimePrecisionV1::Minute,
        }).unwrap(),
    );
    let instant: Instant = scrypto_decode(&rtn).unwrap();
    instant.seconds_since_unix_epoch
}
```
