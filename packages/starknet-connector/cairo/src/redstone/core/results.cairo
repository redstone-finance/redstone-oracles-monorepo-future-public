from starkware.cairo.common.alloc import alloc
from starkware.cairo.common.dict import dict_write, dict_read
from starkware.cairo.common.dict_access import DictAccess
from starkware.cairo.common.serialize import serialize_word

from redstone.utils.array import (
    ARRAY_UNKNOWN_INDEX,
    Array,
    array_index,
    array_new,
    serialize_array,
    array_sort,
)
from redstone.utils.dict import DICT_UNKNOWN_VALUE

from redstone.core.config import (
    Config,
    get_price_and_signer_indices,
    get_config_len,
    get_config_index,
)

struct Results {
    ptr: Array*,
    len: felt,
}

func write_results_value{range_check_ptr, dict_ptr: DictAccess*}(
    config: Config, value: felt, price_index: felt, signer_index: felt
) {
    let key = get_config_index(config=config, price_index=price_index, signer_index=signer_index);

    dict_write(key, value);

    return ();
}

func make_results{range_check_ptr, dict_ptr: DictAccess*}(config: Config) -> Results {
    alloc_locals;

    local results: Results;
    let (ptr: Array*) = alloc();
    assert results.ptr = ptr;
    assert results.len = config.requested_feed_ids.len;

    let empty_arr = array_new(len=0);

    _make_results(
        config=config,
        last_price_index=ARRAY_UNKNOWN_INDEX,
        price_count_acc=0,
        price_arr_acc=empty_arr,
        index=0,
        res=results,
    );

    return results;
}

func _make_results{range_check_ptr, dict_ptr: DictAccess*}(
    config: Config,
    last_price_index: felt,
    price_count_acc: felt,
    price_arr_acc: Array,
    index: felt,
    res: Results,
) {
    alloc_locals;

    let (price_index, signer_index) = get_price_and_signer_indices(config=config, index=index);

    local signer_count;
    local price_count;
    local price_arr: Array;
    let empty_arr = array_new(len=config.allowed_signer_addresses.len);

    if (price_index != last_price_index) {
        if (last_price_index != ARRAY_UNKNOWN_INDEX) {
            local tmp_arr: Array = Array(ptr=price_arr_acc.ptr, len=price_count_acc);
            assert res.ptr[last_price_index] = tmp_arr;
        }

        assert price_count = 0;
        assert price_arr = empty_arr;
    } else {
        assert price_count = price_count_acc;
        assert price_arr = price_arr_acc;
    }

    let last_index = get_config_len(config=config);
    if (index == last_index) {
        return ();
    }

    let (value) = dict_read(index);

    local price_count_inc;
    if (value != DICT_UNKNOWN_VALUE) {
        assert price_arr.ptr[price_count] = value;
        assert price_count_inc = 1;
    } else {
        assert price_count_inc = 0;
    }

    return _make_results(
        config=config,
        last_price_index=price_index,
        price_count_acc=price_count_inc + price_count,
        price_arr_acc=price_arr,
        index=index + 1,
        res=res,
    );
}

func serialize_results_dic{range_check_ptr, output_ptr: felt*, dict_ptr: DictAccess*}(
    config: Config, index: felt
) {
    let last_index = get_config_len(config=config);
    if (index == last_index) {
        return ();
    }

    let (price_index, signer_index) = get_price_and_signer_indices(config=config, index=index);
    serialize_word(price_index);
    serialize_word(signer_index);

    let (value) = dict_read(index);
    serialize_word(value);

    return serialize_results_dic(config=config, index=index + 1);
}

func serialize_results{output_ptr: felt*, range_check_ptr}(arr: Results, index: felt) {
    if (index == arr.len) {
        return ();
    }

    serialize_word(index);
    serialize_array(arr=arr.ptr[index], index=0);

    return serialize_results(arr=arr, index=index + 1);
}
