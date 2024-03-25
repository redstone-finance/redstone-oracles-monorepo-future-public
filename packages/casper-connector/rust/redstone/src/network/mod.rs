pub mod as_str;
pub mod assert;
pub mod error;
pub mod print_debug;
pub mod specific;

#[cfg(feature = "network_casper")]
pub mod casper;

#[cfg(feature = "network_casper")]
pub type _Network = casper::Casper;

pub mod flattened;
#[cfg(not(feature = "network_casper"))]
mod std;

#[cfg(not(feature = "network_casper"))]
pub type _Network = std::Std;
