pub trait Felt252Convertible<T> {
    fn from_felt252(value: felt252) -> T;
    fn to_felt252(self: T) -> felt252;
}
