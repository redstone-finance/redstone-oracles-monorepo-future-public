use core::array::ArrayTrait;
use redstone::numbers::Felt252PartialOrd;
use redstone::sliceable_array::SliceableArrayTrait;

pub(crate) trait SortableTrait<T> {
    fn sorted(self: @T) -> @T;
}

impl SortableArray<
    U, impl PartialOrd: PartialOrd<U>, impl UCopy: Copy<U>, impl UDrop: Drop<U>
> of SortableTrait<Array<U>> {
    fn sorted(self: @Array<U>) -> @Array<U> {
        merge_sort(self)
    }
}

fn merge_sort<U, impl UPartialOrd: PartialOrd<U>, impl UCopy: Copy<U>, impl UDrop: Drop<U>>(
    arr: @Array<U>
) -> @Array<U> {
    if (arr.len() == 1_usize) {
        return arr;
    }

    let slice = arr.slice_tail(arr.len() / 2_usize);

    let sorted_head = merge_sort(slice.head);
    let sorted_tail = merge_sort(slice.tail);

    @merge(first_arr: sorted_head, second_arr: sorted_tail)
}

fn merge<U, impl UPartialOrd: PartialOrd<U>, impl UCopy: Copy<U>, impl UDrop: Drop<U>>(
    first_arr: @Array<U>, second_arr: @Array<U>
) -> Array<U> {
    let mut res: Array<U> = Default::default();

    _merge(:first_arr, :second_arr, first_index: 0_usize, second_index: 0_usize, ref :res);

    res
}

fn _merge<U, impl UPartialOrd: PartialOrd<U>, impl UCopy: Copy<U>, impl UDrop: Drop<U>>(
    first_arr: @Array<U>,
    second_arr: @Array<U>,
    first_index: usize,
    second_index: usize,
    ref res: Array<U>
) {
    if (first_index == first_arr.len()) {
        if (second_index == second_arr.len()) {
            return ();
        }
    }

    let mut first_index = first_index;
    let mut second_index = second_index;

    if (first_index == first_arr.len()) {
        res.append(*second_arr[second_index]);
        second_index += 1_usize;
    } else if (second_index == second_arr.len()) {
        res.append(*first_arr[first_index]);
        first_index += 1_usize;
    } else if (*second_arr[second_index] < *first_arr[first_index]) {
        res.append(*second_arr[second_index]);
        second_index += 1_usize;
    } else {
        res.append(*first_arr[first_index]);
        first_index += 1_usize;
    }

    _merge(:first_arr, :second_arr, :first_index, :second_index, ref :res);
}
