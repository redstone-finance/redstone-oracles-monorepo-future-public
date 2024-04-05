use core::integer::u256;
use core::option::OptionTrait;
use core::traits::Into;
// use core::integer::u256_from_felt252;
// use core::integer::u128_to_felt252;
// use core::integer::u128_from_felt252;
use core::traits::TryInto;

pub impl Felt252PartialOrd of PartialOrd<felt252> {
    #[inline(always)]
    fn le(lhs: felt252, rhs: felt252) -> bool {
        !(rhs < lhs)
    }
    #[inline(always)]
    fn ge(lhs: felt252, rhs: felt252) -> bool {
        !(lhs < rhs)
    }
    #[inline(always)]
    fn lt(lhs: felt252, rhs: felt252) -> bool {
        let l: u256 = lhs.into();
        let r: u256 = rhs.into();

        l < r
    }
    #[inline(always)]
    fn gt(lhs: felt252, rhs: felt252) -> bool {
        rhs < lhs
    }
}

pub impl Felt252Div of Div<felt252> {
    //TODO: change to u256
    fn div(lhs: felt252, rhs: felt252) -> felt252 {
        let l: u128 = lhs.try_into().unwrap();
        let r: u128 = rhs.try_into().unwrap();

        (l / r).into()
    }
}
