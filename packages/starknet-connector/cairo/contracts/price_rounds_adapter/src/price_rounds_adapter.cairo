#[starknet::contract]
mod PriceRoundsAdapter {
    use core::array::ArrayTrait;
    use core::option::OptionTrait;
    use core::starknet::{ContractAddress, get_block_info, get_block_timestamp, get_caller_address};
    use core::starknet::storage_access::Store;
    use core::traits::{Into, TryInto};
    use interface::round_data::RoundData;
    use price_rounds_adapter::round_data_u64tuple_convertible::RoundDataU64TupleConvertible;
    use redstone::config::Config;
    use redstone::numbers::{Felt252Div, Felt252PartialOrd};
    use redstone::processor::process_payload;
    use redstone::sliceable_array::{ArrayCopy, SliceableArray, SliceableArrayTrait};
    use utils::array_storage::ArraySerde;
    use utils::felt252_convertible_storage::StoreFelt252Convertible;
    use utils::u64tuple_convertible::U64TupleFelt252Convertible;

    use core::box::BoxTrait;
    #[storage]
    struct Storage {
        signer_count: usize,
        signers: Array<felt252>,
        owner: ContractAddress,
        feed_ids: Array<felt252>,
        price_values: LegacyMap::<felt252, felt252>,
        round_data: RoundData,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner_address: felt252,
        signer_count_threshold: felt252,
        signer_addresses: Array<felt252>
    ) {
        self.owner.write(owner_address.try_into().unwrap());

        assert(signer_count_threshold > 0, 'Wrong signer count threshold');
        assert(
            signer_addresses.len().into() >= signer_count_threshold, 'Wrong number of addresses'
        );

        self.signer_count.write(signer_count_threshold.try_into().unwrap());
        self.signers.write(signer_addresses);
        self.feed_ids.write(Default::default());
        self
            .round_data
            .write(
                RoundData {
                    round_number: 0, payload_timestamp: 0, block_number: 0, block_timestamp: 0
                }
            )
    }

    #[external(v0)]
    fn read_price(self: @ContractState, feed_id: felt252) -> felt252 {
        self.price_values.read(feed_id)
    }

    #[external(v0)]
    fn read_round_data(self: @ContractState) -> RoundData {
        self.round_data.read()
    }

    #[external(v0)]
    fn read_round_data_and_price(self: @ContractState, feed_id: felt252) -> (RoundData, felt252,) {
        (read_round_data(self), read_price(self, :feed_id))
    }

    //TODO: change write_prices & payload_timestamp to u64
    #[external(v0)]
    fn write_prices(
        ref self: ContractState,
        round_number: felt252,
        feed_ids: Array<felt252>,
        payload_bytes: Array<u8>
    ) {
        let config = Config {
            block_timestamp: get_block_timestamp(),
            feed_ids: @feed_ids,
            signer_count_threshold: self.signer_count.read(),
            signers: @self.signers.read()
        };

        let results = process_payload(:payload_bytes, :config);
        let prices = results.aggregated_values.copied();

        write_price_values_internal(
            ref self,
            :round_number,
            :feed_ids,
            :prices,
            payload_timestamp: results.min_timestamp / 1000
        )
    }

    #[external(v0)]
    fn write_price_values(
        ref self: ContractState,
        round_number: felt252,
        feed_ids: Array<felt252>,
        prices: Array<felt252>,
        payload_timestamp: felt252
    ) {
        assert((self.owner.read() == get_caller_address()), 'Caller is not the owner');
        write_price_values_internal(
            ref self, :round_number, :feed_ids, prices: prices, :payload_timestamp
        )
    }

    fn write_price_values_internal(
        ref self: ContractState,
        round_number: felt252,
        feed_ids: Array<felt252>,
        prices: Array<felt252>,
        payload_timestamp: felt252
    ) {
        assert(feed_ids.len() == prices.len(), 'Different array lengths');

        let read_data = read_round_data(@self);

        assert(round_number == (read_data.round_number + 1).into(), 'Wrong round number');

        assert(payload_timestamp < 10000000000, 'Timestamp must be normalized');
        assert(payload_timestamp > read_data.payload_timestamp.into(), 'Wrong payload timestamp');

        let data = RoundData {
            block_number: get_block_info().unbox().block_number,
            block_timestamp: get_block_timestamp(),
            round_number: round_number.try_into().unwrap(),
            payload_timestamp: payload_timestamp.try_into().unwrap()
        };

        clear_values(ref self, self.feed_ids.read(), index: 0);

        self.feed_ids.write(feed_ids.copied());
        _write_price_values(ref self, feed_ids: @feed_ids, values: prices, index: 0);
        self.round_data.write(data);
    }

    fn _write_price_values(
        ref self: ContractState, feed_ids: @Array<felt252>, values: Array<felt252>, index: usize
    ) {
        if (feed_ids.len() == index) {
            return ();
        }

        self.price_values.write(*feed_ids[index], *values[index]);

        _write_price_values(ref self, :feed_ids, :values, index: index + 1)
    }

    fn clear_values(ref self: ContractState, feed_ids: Array<felt252>, index: usize) {
        if (feed_ids.len() == index) {
            return ();
        }

        self.price_values.write(*feed_ids[index], 0);

        clear_values(ref self, :feed_ids, index: index + 1)
    }
}
