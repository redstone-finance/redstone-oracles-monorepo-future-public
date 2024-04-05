use interface::round_data::RoundData;

#[starknet::interface]
pub trait IPriceRoundsAdapter<TContractState> {
    fn read_price(self: @TContractState, feed_id: felt252) -> felt252;
    fn read_round_data(self: @TContractState) -> RoundData;
    fn read_round_data_and_price(self: @TContractState, feed_id: felt252) -> (RoundData, felt252,);
}
