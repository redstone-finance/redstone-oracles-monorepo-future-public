//! # RedStone
//!
//! `redstone` is a collection of utilities to make deserializing&decrypting RedStone payload.
//! It contains a pure Rust implementation and also an extension for the Casper network.
//!
//! Different crypto-mechanisms are easily injectable.
//! The current implementation contains `secp256k1`- and `k256`-based variants.

#[cfg(feature = "core")]
pub mod core;

#[cfg(feature = "core")]
mod crypto;

#[cfg(feature = "core")]
mod protocol;

#[cfg(feature = "core")]
mod utils;

#[cfg(feature = "network")]
pub mod network;

#[cfg(feature = "helpers")]
pub mod helpers;
