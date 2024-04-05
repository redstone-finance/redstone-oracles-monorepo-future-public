#[starknet::interface]
trait IPriceAdapter<TContractState> {
    fn read_prices(self: @TContractState, feed_ids: Array<felt252>) -> Array<felt252>;
    fn read_timestamp(self: @TContractState) -> felt252;
}


#[starknet::contract]
mod PriceFeed {
    use core::option::OptionTrait;
    use core::traits::{Into, TryInto};
    use starknet::ContractAddress;

    use super::{IPriceAdapterDispatcher, IPriceAdapterDispatcherTrait};

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

    #[external(v0)]
    fn read_price_and_timestamp(self: @ContractState) -> (felt252, felt252) {
        let manager = IPriceAdapterDispatcher {
            contract_address: self.manager_contract_address.read()
        };

        let price = *manager.read_prices(array![self.feed_identifier.read()])[0];
        let timestamp = manager.read_timestamp();

        (price, timestamp)
    }
}
