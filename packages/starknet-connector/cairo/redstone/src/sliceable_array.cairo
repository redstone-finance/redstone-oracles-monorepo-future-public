use core::array::{ArrayTrait, SpanTrait};
use core::option::OptionTrait;
use core::traits::Into;

pub(crate) struct ArraySlice<T> {
    pub(crate) head: @Array<T>,
    pub(crate) tail: @Array<T>,
}

pub impl ArraySliceCopy<T, impl TCopy: Copy<T>> of Copy<ArraySlice<T>>;
pub impl ArraySliceDrop<T, impl TDrop: Drop<T>> of Drop<ArraySlice<T>>;
pub impl ArrayCopy<T, impl TCopy: Copy<T>> of Copy<Array<T>>;

pub trait SliceableArrayTrait<T> {
    fn slice_tail_offset(self: @Array<T>, length: usize, offset: usize) -> ArraySlice<T>;
    fn slice_tail(self: @Array<T>, length: usize) -> ArraySlice<T>;
    fn copied(self: @Array<T>) -> Array<T>;
}

pub impl SliceableArray<T, impl TDrop: Drop<T>, impl TCopy: Copy<T>> of SliceableArrayTrait<T> {
    fn slice_tail_offset(self: @Array<T>, length: usize, offset: usize) -> ArraySlice<T> {
        assert(length + offset <= self.len(), 'Length or offset too big');

        let head_size = self.len() - offset - length;
        if (head_size == 0_usize) {
            return ArraySlice { head: @Default::default(), tail: self };
        }

        let span = self.span();

        let head_span = span.slice(0_usize, head_size);
        let tail_span = span.slice(head_size, length);

        let mut head = ArrayTrait::new();
        head.append_span(head_span);

        let mut tail = ArrayTrait::new();
        tail.append_span(tail_span);

        ArraySlice { head: @head, tail: @tail }
    }

    fn slice_tail(self: @Array<T>, length: usize) -> ArraySlice<T> {
        self.slice_tail_offset(length, 0_usize)
    }

    fn copied(self: @Array<T>) -> Array<T> {
        let mut arr = Default::default();
        array_copy(self, 0, ref arr);

        arr
    }
}

fn array_copy<T, impl TDrop: Drop<T>, impl TCopy: Copy<T>>(
    arr: @Array<T>, index: usize, ref res: Array<T>
) {
    if (index == arr.len()) {
        return ();
    }

    res.append(*arr[index]);
    array_copy(arr, index + 1_usize, ref res)
}

