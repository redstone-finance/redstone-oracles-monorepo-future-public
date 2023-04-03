%lang starknet

from starkware.cairo.common.cairo_builtins import HashBuiltin, BitwiseBuiltin
from starkware.cairo.common.math import assert_nn, assert_le, assert_in_range, sign
from starkware.cairo.common.serialize import serialize_word
from redstone.utils.array import Array, array_new

@storage_var
func price(feed_id: felt) -> (res: felt) {
}

@storage_var
func timestamp() -> (res: felt) {
}

func write_prices{
    syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, bitwise_ptr: BitwiseBuiltin*, range_check_ptr
}(feed_ids: Array, values: Array, index: felt) {
    if (index == feed_ids.len) {
        return ();
    }

    let feed_id = feed_ids.ptr[index];
    let value = values.ptr[index];

    price.write(feed_id, value);

    return write_prices(feed_ids=feed_ids, values=values, index=index + 1);
}

func read_prices{
    syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, bitwise_ptr: BitwiseBuiltin*, range_check_ptr
}(feed_ids_len: felt, feed_ids: felt*) -> Array {
    alloc_locals;

    let feed_arr: Array = Array(ptr=feed_ids, len=feed_ids_len);
    let res: Array = array_new(len=feed_ids_len);
    _read_prices(feed_ids=feed_arr, index=0, res=res);

    return res;
}

func _read_prices{
    syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, bitwise_ptr: BitwiseBuiltin*, range_check_ptr
}(feed_ids: Array, index: felt, res: Array) {
    if (index == feed_ids.len) {
        return ();
    }

    let feed_id = feed_ids.ptr[index];
    let (value) = price.read(feed_id);
    assert res.ptr[index] = value;

    return _read_prices(feed_ids=feed_ids, index=index + 1, res=res);
}
