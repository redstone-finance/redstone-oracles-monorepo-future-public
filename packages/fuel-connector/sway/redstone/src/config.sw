library config;

dep utils/vec;

use std::{option::*, u256::U256};
use vec::{value_index, value_index_b256};

pub struct Config {
    signers: Vec<b256>,
    feed_ids: Vec<U256>,
    signer_count_threshold: u64,
    block_timestamp: u64, // unix
}

impl Config {
    pub fn cap(self) -> u64 {
        return self.signers.len * self.feed_ids.len;
    }

    pub fn signer_index(self, signer: b256) -> Option<u64> {
        return value_index_b256(self.signers, signer);
    }

    pub fn feed_id_index(self, feed_id: U256) -> Option<u64> {
        return value_index(self.feed_ids, feed_id);
    }

    pub fn index(self, feed_id_index: u64, signer_index: u64) -> u64 {
        return self.signers.len * feed_id_index + signer_index
    }
}
