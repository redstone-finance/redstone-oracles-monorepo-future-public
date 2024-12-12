#[cfg(feature = "real_network")]
pub use real_network::{make_feed_ids, FeedId};

#[cfg(not(feature = "real_network"))]
pub use not_real_network::{make_feed_ids, FeedId};

pub type U256Digits = [u64; 4];

#[cfg(feature = "real_network")]
mod real_network {

    pub type FeedId = Vec<u8>;
    pub type FeedIds = Vec<FeedId>;

    #[inline]
    pub fn make_feed_ids(input: Vec<FeedId>) -> FeedIds {
        input
    }
}

#[cfg(not(feature = "real_network"))]
mod not_real_network {
    pub type FeedId = String;
    pub type FeedIds = String;

    pub const DATA_SEPARATOR: &str = ",";

    #[inline]
    pub fn make_feed_ids(input: Vec<FeedId>) -> FeedIds {
        input.join(DATA_SEPARATOR)
    }
}
