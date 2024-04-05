use core::serde::Serde;

#[derive(Drop, Serde)]
pub struct Round {
    pub round_id: felt252,
    pub answer: felt252,
    pub block_num: felt252,
    pub started_at: felt252,
    pub updated_at: felt252,
}
