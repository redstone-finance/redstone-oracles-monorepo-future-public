use core::array::{ArrayTrait, SpanTrait};
use core::traits::{IndexView, Into};
use redstone::sliceable_array::SliceableArrayTrait;

#[derive(Copy, Drop)]
pub(crate) struct NumberArraySlice {
    pub(crate) head: @Array<u8>,
    pub(crate) number: felt252
}

pub(crate) trait NumberConvertibleArrayTrait {
    fn slice_number_offset(self: @Array<u8>, length: usize, offset: usize) -> NumberArraySlice;
    fn slice_number(self: @Array<u8>, length: usize) -> NumberArraySlice;
    fn to_felt252(self: @Array<u8>) -> felt252;
    fn to_u256(self: @Array<u8>) -> u256;
    fn to_string_number(self: @Array<u8>) -> felt252;
}

impl NumberConvertibleArray of NumberConvertibleArrayTrait {
    fn slice_number(self: @Array<u8>, length: usize) -> NumberArraySlice {
        self.slice_number_offset(length, 0_usize)
    }

    fn slice_number_offset(self: @Array<u8>, length: usize, offset: usize) -> NumberArraySlice {
        let slice = self.slice_tail_offset(length, offset);

        NumberArraySlice { head: slice.head, number: slice.tail.to_felt252() }
    }

    fn to_felt252(self: @Array<u8>) -> felt252 {
        assert(self.len() <= 32_usize, 'Array size to big');

        array_to_felt252(self, self.len(), 1, 0)
    }

    fn to_u256(self: @Array<u8>) -> u256 {
        assert(self.len() <= 32_usize, 'Array size to big');

        array_to_u256(self, self.len(), 1, 0)
    }

    fn to_string_number(self: @Array<u8>) -> felt252 {
        array_trunc(self).to_felt252()
    }
}


fn array_to_felt252(arr: @Array<u8>, len: usize, mlt: felt252, acc: felt252) -> felt252 {
    if (len == 0_u32) {
        return acc;
    }

    let last = *arr[len - 1_usize];

    array_to_felt252(arr, len - 1_usize, mlt * 256, acc + mlt * last.into())
}


fn array_to_u256(arr: @Array<u8>, len: usize, mlt: u256, acc: u256) -> u256 {
    if (len == 0_u32) {
        return acc;
    }

    let last = *arr[len - 1_usize];
    let sum = acc + mlt * last.into();

    let new_mlt = (if (len == 1) {
        0 // will be finishing in the next step.
    } else {
        256 * mlt
    });

    array_to_u256(arr, len - 1_usize, new_mlt, sum)
}

fn array_trunc(arr: @Array<u8>) -> @Array<u8> {
    let mut res_span = arr.span();

    _array_trunc(ref res_span);

    let mut res = ArrayTrait::new();
    res.append_span(res_span);

    @res
}
// TODO: ArrayFromSpan

fn _array_trunc(ref arr: Span<u8>) {
    if (arr.len() == 0_usize) {
        return ();
    }

    let last = *arr[arr.len() - 1_usize];
    if last != 0_u8 {
        return ();
    }

    let _ = arr.pop_back();

    _array_trunc(ref arr)
}
