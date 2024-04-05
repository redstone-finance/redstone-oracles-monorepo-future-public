use price_rounds_feed::round::Round;

#[starknet::interface]
pub trait IPriceRoundsFeed<TContractState> {
    fn latest_round_data(self: @TContractState) -> Round;
    fn round_data(self: @TContractState, round_id: felt252) -> Round;
    fn description(self: @TContractState) -> felt252;
    fn decimals(self: @TContractState) -> felt252;
    fn type_and_version(self: @TContractState) -> felt252;
}

#[starknet::contract]
mod PriceRoundsFeed {
    use core::option::OptionTrait;
    use core::traits::Into;
    use core::traits::TryInto;
    use interface::price_rounds_adapter_interface::IPriceRoundsAdapterDispatcher;
    use interface::price_rounds_adapter_interface::IPriceRoundsAdapterDispatcherTrait;
    use price_rounds_feed::round::Round;
    use starknet::ContractAddress;

    #[storage]
    struct Storage {
        manager_contract_address: ContractAddress,
        feed_identifier: felt252,
    }

    #[constructor]
    fn constructor(ref self: ContractState, manager_address: felt252, feed_id: felt252) {
        self.manager_contract_address.write(manager_address.try_into().unwrap());
        self.feed_identifier.write(feed_id);
    }

    #[abi(embed_v0)]
    impl NameRegistry of super::IPriceRoundsFeed<ContractState> {
        fn latest_round_data(self: @ContractState) -> Round {
            let manager = IPriceRoundsAdapterDispatcher {
                contract_address: self.manager_contract_address.read()
            };

            let (round_data, price) = manager
                .read_round_data_and_price(self.feed_identifier.read());

            Round {
                round_id: round_data.round_number.into(),
                answer: price,
                block_num: round_data.block_number.into(),
                started_at: round_data.payload_timestamp.into(),
                updated_at: round_data.block_timestamp.into(),
            }
        }

        fn round_data(self: @ContractState, round_id: felt252) -> Round {
            panic(Default::default())
        }

        fn description(self: @ContractState) -> felt252 {
            self.feed_identifier.read()
        }

        fn decimals(self: @ContractState) -> felt252 {
            8
        }

        fn type_and_version(self: @ContractState) -> felt252 {
            '2.6.2'
        }
    }
}
