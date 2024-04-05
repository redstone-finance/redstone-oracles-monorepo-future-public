use core::array::ArrayTrait;
use redstone::config::{Config, ConfigurableTrait};
use redstone::crypto::{VerifiableTrait, VerifiableU8Array};
use redstone::index_of::IndexOfTrait;
use redstone::protocol::DataPackage;
use redstone::signature::RedstoneSignature;
use redstone::timestamp_validation::validate_timestamp;

/// 655360000 + feed_index + 10000 * count
const INSUFFICIENT_SIGNER_COUNT: felt252 = 0x27100000;

/// 1310720000 + data_package_index
const SIGNER_NOT_RECOGNIZED: felt252 = 0x4e200000;

pub(crate) trait ValidableTrait<T> {
    fn validate_timestamp(self: T, index: usize, timestamp: felt252);
    fn validate_signer_count(self: T, feed_index: usize, count: usize);
    fn signer_index(self: T, data_package: DataPackage) -> Option<usize>;
}

pub(crate) impl ValidableConfig of ValidableTrait<Config> {
    fn validate_timestamp(self: Config, index: usize, timestamp: felt252) {
        validate_timestamp(:index, :timestamp, block_timestamp: self.block_timestamp);
    }

    fn validate_signer_count(self: Config, feed_index: usize, count: usize) {
        assert(
            count >= self.signer_count_threshold,
            INSUFFICIENT_SIGNER_COUNT + (feed_index + 10000_usize * count).into()
        );
    }

    fn signer_index(self: Config, data_package: DataPackage) -> Option<usize> {
        let address = VerifiableU8Array::recover(
            message_hash: data_package.signable_bytes.hash(), signature: data_package.signature
        );

        match address {
            Option::Some(recovered) => self.signers.index_of(recovered),
            Option::None => Option::None
        }
    }
}
