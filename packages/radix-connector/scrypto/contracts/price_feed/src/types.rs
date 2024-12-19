#[cfg(feature = "real_network")]
pub use real_network::*;

#[cfg(not(feature = "real_network"))]
pub use not_real_network::*;

pub type U256Digits = [u64; 4];

#[cfg(feature = "real_network")]
mod real_network {
    pub type FeedId = Vec<u8>;
}

#[cfg(not(feature = "real_network"))]
mod not_real_network {
    pub type FeedId = String;
}
