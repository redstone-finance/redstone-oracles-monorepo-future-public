%lang starknet

from starkware.cairo.common.cairo_builtins import BitwiseBuiltin

from redstone.protocol.data_package import DataPackage
from redstone.utils.array import Array
from redstone.core.config import Config
from redstone.core.results import Results

from demo.execute import execute

@external
func test_execute_for_all_feeds_1_signer{
    syscall_ptr: felt*, range_check_ptr, bitwise_ptr: BitwiseBuiltin*
}() {
    alloc_locals;

    let (payload, results, aggregated) = execute(test_id=1);

    _check_data_package(
        package=payload.data_packages.ptr[0],
        timestamp=1675358050000,
        signature_v=28,
        feed_index=1,
        feed_id='BTC',
        feed_value=2382142920000,
    );

    _check_data_package(
        package=payload.data_packages.ptr[0],
        timestamp=1675358050000,
        signature_v=28,
        feed_index=3,
        feed_id='ETH',
        feed_value=167496049160,
    );

    assert payload.min_timestamp = 1675358050000;

    // BTC values
    assert results.ptr[0].ptr[0] = 2382142920000;

    // ETH values
    assert results.ptr[1].ptr[0] = 167496049160;

    assert aggregated.ptr[0] = 2382142920000;  // median of BTC
    assert aggregated.ptr[1] = 167496049160;  // median of ETH

    return ();
}

@external
func test_execute_for_all_feeds_2_signers{
    syscall_ptr: felt*, range_check_ptr, bitwise_ptr: BitwiseBuiltin*
}() {
    alloc_locals;

    let (payload, results, aggregated) = execute(test_id=2);

    _check_data_package(
        package=payload.data_packages.ptr[0],
        timestamp=1675358460000,
        signature_v=28,
        feed_index=1,
        feed_id='BTC',
        feed_value=2382242973443,
    );

    _check_data_package(
        package=payload.data_packages.ptr[1],
        timestamp=1675358460000,
        signature_v=28,
        feed_index=1,
        feed_id='BTC',
        feed_value=2382116462690,
    );

    _check_data_package(
        package=payload.data_packages.ptr[0],
        timestamp=1675358460000,
        signature_v=28,
        feed_index=3,
        feed_id='ETH',
        feed_value=167451232145,
    );

    _check_data_package(
        package=payload.data_packages.ptr[1],
        timestamp=1675358460000,
        signature_v=28,
        feed_index=3,
        feed_id='ETH',
        feed_value=167451232145,
    );

    assert payload.min_timestamp = 1675358460000;

    // BTC values
    assert results.ptr[0].ptr[0] = 2382116462690;
    assert results.ptr[0].ptr[1] = 2382242973443;

    // ETH values
    assert results.ptr[1].ptr[0] = 167451232145;
    assert results.ptr[1].ptr[1] = 167451232145;

    assert aggregated.ptr[0] = 2382179718067;  // median of BTC
    assert aggregated.ptr[1] = 167451232145;  // median of ETH

    return ();
}

@external
func test_execute_for_all_feeds_3_signers{
    syscall_ptr: felt*, range_check_ptr, bitwise_ptr: BitwiseBuiltin*
}() {
    alloc_locals;

    let (payload, results, aggregated) = execute(test_id=3);

    _check_data_package(
        package=payload.data_packages.ptr[0],
        timestamp=1675357430000,
        signature_v=28,
        feed_index=1,
        feed_id='BTC',
        feed_value=2383330000000,
    );

    _check_data_package(
        package=payload.data_packages.ptr[1],
        timestamp=1675357430000,
        signature_v=28,
        feed_index=1,
        feed_id='BTC',
        feed_value=2383256854521,
    );

    _check_data_package(
        package=payload.data_packages.ptr[2],
        timestamp=1675357430000,
        signature_v=28,
        feed_index=3,
        feed_id='ETH',
        feed_value=167564652812,
    );

    assert payload.min_timestamp = 1675357430000;

    // BTC values
    assert results.ptr[0].ptr[0] = 2383256854521;
    assert results.ptr[0].ptr[1] = 2383256854521;
    assert results.ptr[0].ptr[2] = 2383330000000;

    // ETH values
    assert results.ptr[1].ptr[0] = 167564652812;
    assert results.ptr[1].ptr[1] = 167574154011;
    assert results.ptr[1].ptr[2] = 167573175827;

    assert aggregated.ptr[0] = 2383256854521;  // median of BTC
    assert aggregated.ptr[1] = 167573175827;  // median of ETH

    return ();
}

@external
func test_execute_for_2_feeds_2_signers{
    syscall_ptr: felt*, range_check_ptr, bitwise_ptr: BitwiseBuiltin*
}() {
    alloc_locals;

    let (payload, results, aggregated) = execute(test_id=22);

    _check_data_package(
        package=payload.data_packages.ptr[0],
        timestamp=1675354990000,
        signature_v=27,
        feed_index=0,
        feed_id='BTC',
        feed_value=2383650676800,
    );

    _check_data_package(
        package=payload.data_packages.ptr[1],
        timestamp=1675354990000,
        signature_v=27,
        feed_index=0,
        feed_id='BTC',
        feed_value=2383637675760,
    );

    _check_data_package(
        package=payload.data_packages.ptr[2],
        timestamp=1675354990000,
        signature_v=28,
        feed_index=0,
        feed_id='ETH',
        feed_value=167930000000,
    );

    _check_data_package(
        package=payload.data_packages.ptr[3],
        timestamp=1675354990000,
        signature_v=28,
        feed_index=0,
        feed_id='ETH',
        feed_value=167937717000,
    );

    assert payload.min_timestamp = 1675354990000;

    // BTC values
    assert results.ptr[0].ptr[0] = 2383650676800;
    assert results.ptr[0].ptr[1] = 2383637675760;

    // ETH values
    assert results.ptr[1].ptr[0] = 167937717000;
    assert results.ptr[1].ptr[1] = 167930000000;

    assert aggregated.ptr[0] = 2383644176280;  // median of BTC
    assert aggregated.ptr[1] = 167933858500;  // median of ETH

    return ();
}

func _check_data_package(
    package: DataPackage,
    timestamp: felt,
    signature_v: felt,
    feed_index: felt,
    feed_id: felt,
    feed_value: felt,
) {
    assert package.timestamp = timestamp;
    assert package.signature.v = signature_v;
    assert package.data_points.ptr[feed_index].feed_id = feed_id;
    assert package.data_points.ptr[feed_index].value = feed_value;

    return ();
}
