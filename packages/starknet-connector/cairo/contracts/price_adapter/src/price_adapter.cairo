#[starknet::contract]
mod PriceAdapter {
    use core::array::ArrayTrait;
    use core::option::OptionTrait;
    use core::starknet::{get_block_timestamp, storage_access::Store};
    use core::traits::{Into, TryInto};
    use redstone::config::Config;
    use redstone::numbers::Felt252PartialOrd;
    use redstone::processor::process_payload;
    use redstone::sliceable_array::{ArrayCopy, SliceableArray, SliceableArrayTrait};
    use utils::array_storage::ArraySerde;

    #[storage]
    struct Storage {
        signer_count: usize,
        signers: Array<felt252>,
        price_values: LegacyMap::<felt252, felt252>,
        timestamp: felt252
    }

    #[constructor]
    fn constructor(
        ref self: ContractState, signer_count_threshold: felt252, signer_addresses: Array<felt252>
    ) {
        assert(signer_count_threshold > 0, 'Wrong signer count threshold');
        assert(
            signer_addresses.len().into() >= signer_count_threshold, 'Wrong number of addresses'
        );

        self.signer_count.write(signer_count_threshold.try_into().unwrap());
        self.signers.write(signer_addresses);
    }

    #[external(v0)]
    fn get_prices(
        self: @ContractState, feed_ids: Array<felt252>, payload_bytes: Array<u8>
    ) -> Array<felt252> {
        let config = Config {
            block_timestamp: get_block_timestamp(),
            feed_ids: @feed_ids,
            signer_count_threshold: self.signer_count.read(),
            signers: @self.signers.read()
        };

        let results = process_payload(:payload_bytes, :config);
        results.aggregated_values.copied()
    }

    #[external(v0)]
    fn read_timestamp(self: @ContractState) -> felt252 {
        self.timestamp.read()
    }

    #[external(v0)]
    fn read_prices(self: @ContractState, feed_ids: Array<felt252>) -> Array<felt252> {
        let mut result = Default::default();

        read_price_values(self, :feed_ids, index: 0, ref :result);

        result
    }

    #[external(v0)]
    fn write_prices(ref self: ContractState, feed_ids: Array<felt252>, payload_bytes: Array<u8>) {
        let config = Config {
            block_timestamp: get_block_timestamp(),
            feed_ids: @feed_ids,
            signer_count_threshold: self.signer_count.read(),
            signers: @self.signers.read()
        };

        let results = process_payload(:payload_bytes, :config);

        write_price_values(ref self, :feed_ids, values: results.aggregated_values, index: 0);
        self.timestamp.write(results.min_timestamp);
    }

    fn write_price_values(
        ref self: ContractState, feed_ids: Array<felt252>, values: @Array<felt252>, index: usize
    ) {
        if (feed_ids.len() == index) {
            return ();
        }

        self.price_values.write(*feed_ids[index], *values[index]);

        write_price_values(ref self, :feed_ids, :values, index: index + 1)
    }

    fn read_price_values(
        self: @ContractState, feed_ids: Array<felt252>, index: usize, ref result: Array<felt252>
    ) {
        if (index == feed_ids.len()) {
            return ();
        }

        let value = self.price_values.read(*feed_ids[index]);
        result.append(value);

        read_price_values(self, :feed_ids, index: index + 1, ref :result)
    }
}
