use redstone::protocol::Payload;

#[derive(Copy, Drop)]
pub struct Results {
    pub min_timestamp: felt252,
    pub values: @Array<@Array<felt252>>,
    pub aggregated_values: @Array<felt252>,
}
