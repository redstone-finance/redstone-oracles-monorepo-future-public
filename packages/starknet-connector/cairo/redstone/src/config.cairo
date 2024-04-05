use core::array::ArrayTrait;
use redstone::config_validation::ValidableConfig;
use redstone::config_validation::ValidableTrait;
use redstone::index_of::IndexOfTrait;
use redstone::protocol::DataPackage;
use redstone::timestamp_validation::validate_timestamp;

#[derive(Copy, Drop)]
pub struct Config {
    pub signers: @Array<felt252>,
    pub feed_ids: @Array<felt252>,
    pub signer_count_threshold: usize,
    pub block_timestamp: u64, // unix
}

pub(crate) trait ConfigurableTrait<T> {
    fn cap(self: T) -> usize;
    fn index_in_array(self: T, feed_id: felt252, signer_index: usize) -> Option<usize>;
    fn validate_signer(self: T, data_package: DataPackage) -> Option<usize>;
}

pub(crate) impl ConfigurableConfig of ConfigurableTrait<Config> {
    fn cap(self: Config) -> usize {
        self.feed_ids.len() * self.signers.len()
    }

    fn index_in_array(self: Config, feed_id: felt252, signer_index: usize) -> Option<usize> {
        let feed_index = self.feed_ids.index_of(feed_id);

        match feed_index {
            Option::Some(index) => Option::Some(
                index_in_array(feed_index: index, :signer_index, signer_count: self.signers.len())
            ),
            Option::None(_) => Option::None(()),
        }
    }

    fn validate_signer(self: Config, data_package: DataPackage) -> Option<usize> {
        if self.signers.len() == 0_usize {
            return Option::Some(data_package.index);
        }

        self.signer_index(:data_package)
    }
}

pub(crate) fn index_in_array(feed_index: usize, signer_index: usize, signer_count: usize) -> usize {
    feed_index * signer_count + signer_index
}
