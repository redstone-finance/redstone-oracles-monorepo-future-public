use core::dict::Felt252DictTrait;
use core::traits::Into;
use redstone::numbers::Felt252PartialOrd;

const DICT_UNKNOWN_VALUE: felt252 = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;

pub(crate) trait OptionalDictTrait<T> {
    fn new_of_size(size: usize) -> Felt252Dict<T>;
    fn get_or_none(ref self: Felt252Dict<T>, index: felt252) -> Option<T>;
}

impl OptionalDictFelt252 of OptionalDictTrait<felt252> {
    fn new_of_size(size: usize) -> Felt252Dict<felt252> {
        let mut dict: Felt252Dict<felt252> = Default::default();

        dict_fill(ref :dict, value: DICT_UNKNOWN_VALUE, count: size.into(), index: 0);
        dict.insert(DICT_UNKNOWN_VALUE, size.into());

        dict
    }

    fn get_or_none(ref self: Felt252Dict<felt252>, index: felt252) -> Option<felt252> {
        if (self[index] == DICT_UNKNOWN_VALUE) {
            return Option::None(());
        }

        if (index >= self[DICT_UNKNOWN_VALUE]) {
            return Option::None(());
        }

        Option::Some(self[index])
    }
}

fn dict_fill<T, impl TCopy: Copy<T>, impl TDrop: Drop<T>, impl TDefault: Felt252DictValue<T>>(
    ref dict: Felt252Dict<T>, value: T, count: felt252, index: felt252
) {
    if (index == count) {
        return ();
    }

    dict.insert(index, value);
    dict_fill(ref :dict, :value, :count, index: index + 1)
}

impl Felt252DictCopy<T, impl TCopy: Copy<T>> of Copy<Felt252Dict<T>>;

