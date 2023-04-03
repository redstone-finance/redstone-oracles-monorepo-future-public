from starkware.cairo.common.alloc import alloc
from starkware.cairo.common.cairo_builtins import BitwiseBuiltin, HashBuiltin
from starkware.cairo.common.math import assert_nn, unsigned_div_rem
from starkware.cairo.common.dict_access import DictAccess
from starkware.cairo.common.serialize import serialize_word

from redstone.protocol.payload import Payload, get_payload
from redstone.protocol.data_package import DataPackageArray
from redstone.protocol.data_point import DataPointArray

from redstone.utils.array import ARRAY_UNKNOWN_INDEX, Array, array_index, array_new, array_sort
from redstone.utils.dict import Dict, dict_new

from redstone.crypto.keccak import keccak_finalize

from redstone.core.config import Config
from redstone.core.results import Results, make_results, write_results_value
from redstone.core.validation import (
    validate_timestamp,
    validate_signature,
    validate_signer_count_threshold,
)

func process_payload{range_check_ptr, bitwise_ptr: BitwiseBuiltin*}(
    data_ptr: felt*, data_len: felt, config: Config
) -> (payload: Payload, results: Results, aggregated: Array) {
    alloc_locals;

    assert_nn(data_len);

    local payload_arr: Array = Array(ptr=data_ptr, len=data_len);
    let payload = get_payload(bytes_arr=payload_arr);

    let results_dic = dict_new();
    local dict_ptr: DictAccess* = results_dic.ptr;

    let (keccak_ptr: felt*) = alloc();
    local keccak_ptr_start: felt* = keccak_ptr;

    with keccak_ptr {
        process_data_packages{dict_ptr=dict_ptr}(arr=payload.data_packages, config=config, index=0);
    }
    keccak_finalize(keccak_ptr_start=keccak_ptr_start, keccak_ptr_end=keccak_ptr);

    let results = make_results{dict_ptr=dict_ptr}(config=config);
    let aggregated: Array = array_new(len=results.len);

    process_results(results=results, config=config, index=0, res=aggregated);

    return (payload=payload, results=results, aggregated=aggregated);
}

func process_data_packages{
    range_check_ptr, bitwise_ptr: BitwiseBuiltin*, dict_ptr: DictAccess*, keccak_ptr: felt*
}(arr: DataPackageArray, config: Config, index: felt) {
    alloc_locals;

    if (index == arr.len) {
        return ();
    }

    let package = arr.ptr[index];

    validate_timestamp(package_ts_ms=package.timestamp, block_ts=config.block_ts);
    let signer_index = validate_signature(
        signable_arr=package.signable_arr,
        signature=package.signature,
        allowed_signer_addresses=config.allowed_signer_addresses,
        index=index,
    );

    process_data_package(
        data_points=package.data_points, signer_index=signer_index, config=config, index=0
    );

    return process_data_packages(arr=arr, config=config, index=index + 1);
}

func process_data_package{range_check_ptr, dict_ptr: DictAccess*}(
    data_points: DataPointArray, signer_index: felt, config: Config, index: felt
) {
    alloc_locals;

    if (signer_index == ARRAY_UNKNOWN_INDEX) {
        return ();
    }

    if (index == data_points.len) {
        return ();
    }

    let dp = data_points.ptr[index];
    let price_index = array_index(arr=config.requested_feed_ids, key=dp.feed_id);

    write_results_value(
        config=config, value=dp.value, price_index=price_index, signer_index=signer_index
    );

    return process_data_package(
        data_points=data_points, signer_index=signer_index, config=config, index=index + 1
    );
}

func process_results{range_check_ptr}(results: Results, config: Config, index: felt, res: Array) {
    alloc_locals;

    if (index == results.len) {
        return ();
    }

    validate_signer_count_threshold(
        count=results.ptr[index].len, threshold=config.signer_count_threshold, index=index
    );
    let median = calculate_median(results.ptr[index]);

    assert res.ptr[index] = median;

    return process_results(results=results, config=config, index=index + 1, res=res);
}

func calculate_median{range_check_ptr}(arr: Array) -> felt {
    alloc_locals;

    if (arr.len == 0) {
        return 0;
    }

    let sorted_arr = array_sort(arr);

    let (q, r) = unsigned_div_rem(arr.len, 2);
    if (r == 1) {
        return sorted_arr.ptr[q];
    } else {
        let a = sorted_arr.ptr[q];
        let b = sorted_arr.ptr[q - 1];

        let (_, s) = unsigned_div_rem(a + b, 2);

        return (a + b + s) / 2;
    }
}
